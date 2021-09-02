import {
  Component,
  Host,
  h,
  Element,
  Prop,
  Watch,
  EventEmitter,
  Event,
  Method,
  Listen,
  State,
} from '@stencil/core';
import {
  Matrix,
  Matrix4,
  Point,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import { getMouseClientPosition } from '../../lib/dom';
import { Viewport } from '../../lib/types';
import { CircleMarkup, Markup } from '../../lib/types/markup';
import { ViewerMarkupToolType } from '../viewer-markup-tool/viewer-markup-tool';
import { BoundingBox2dAnchorPosition } from '../viewer-markup/utils';
import { BoundingBox2d } from '../viewer-markup/viewer-markup-components';
import { parseBounds, transformCircle } from './utils';

/**
 * The supported markup modes.
 *
 * @see {@link ViewerMarkupCircleMode.mode} - For more details about modes.
 */
export type ViewerMarkupCircleMode = 'edit' | 'replace' | '';

@Component({
  tag: 'vertex-viewer-markup-circle',
  styleUrl: 'viewer-markup-circle.css',
  shadow: true,
})
export class ViewerMarkupCircle {
  /**
   * The bounds of the circle. Can either be an instance of a `Rectangle` or
   * a JSON string representation in the format of `[x, y, width, height]` or
   * `{"x": 0, "y": 0, "width": 10, "height": 10}`.
   */
  @Prop({ mutable: true, attribute: null })
  public bounds?: Rectangle.Rectangle;

  /**
   * The bounds of the circle. Can either be an instance of a `Rectangle` or
   * a JSON string representation in the format of `[x, y, width, height]` or
   * `{"x": 0, "y": 0, "width": 10, "height": 10}`.
   */
  @Prop({ attribute: 'bounds' })
  public boundsJson?: string;

  /**
   * A mode that specifies how the measurement component should behave. When
   * unset, the component will not respond to interactions with the handles.
   * When `edit`, the measurement anchors are interactive and the user is able
   * to reposition them. When `replace`, anytime the user clicks on the canvas,
   * a new measurement will be performed.
   */
  @Prop({ reflect: true })
  public mode: ViewerMarkupCircleMode = '';

  /**
   * The viewer to connect to measurements.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-measurements>` or `<vertex-viewer>` element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Event({ bubbles: true })
  public editBegin!: EventEmitter<void>;

  @Event({ bubbles: true })
  public editEnd!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private elementBounds?: DOMRect;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private drawing = false;

  @State()
  private startPosition?: Point.Point;

  @State()
  private editAnchor: BoundingBox2dAnchorPosition = 'bottom-right';

  @State()
  private resizeBounds?: Rectangle.Rectangle;

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.updateViewport();

    this.handleViewerChanged(this.viewer);

    this.updateBoundsFromProps();
  }

  protected componentDidLoad(): void {
    this.updateBoundsFromProps();

    const resize = new ResizeObserver(() => this.updateViewport());
    resize.observe(this.hostEl);
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    console.log(oldViewer, newViewer);
    if (oldViewer != null) {
      // oldViewer.removeEventListener('frameDrawn', this.handleFrameDrawn);
      this.removeInteractionListeners(oldViewer);
    }

    if (newViewer != null) {
      // newViewer.addEventListener('frameDrawn', this.handleFrameDrawn);
      this.addInteractionListeners(newViewer);
    }
  }

  @Watch('bounds')
  protected handleBoundsJsonChange(): void {
    this.updateBoundsFromProps();
  }

  private updateViewport(): void {
    const rect = this.hostEl.getBoundingClientRect();
    this.viewport = new Viewport(rect.width, rect.height);
    this.elementBounds = rect;
  }

  private updateBoundsFromProps(): void {
    this.bounds = this.bounds ?? parseBounds(this.boundsJson);
  }

  public render(): h.JSX.IntrinsicElements {
    const center =
      this.bounds != null ? Rectangle.center(this.bounds) : undefined;

    console.log(this.mode);

    return this.bounds != null && center != null ? (
      <Host>
        <svg class="svg">
          <ellipse
            class="ellipse"
            cx={center.x}
            cy={center.y}
            rx={this.bounds.width / 2}
            ry={this.bounds.height / 2}
            stroke={'#000ff0'}
            stroke-width={4}
            fill={'none'}
          />
          {this.mode === 'edit' && (
            <BoundingBox2d
              bounds={this.bounds}
              onTopLeftAnchorPointerDown={(e) =>
                this.updateEditAnchor(e, 'top-left')
              }
              onTopRightAnchorPointerDown={(e) =>
                this.updateEditAnchor(e, 'top-right')
              }
              onTopAnchorPointerDown={(e) => this.updateEditAnchor(e, 'top')}
              onBottomLeftAnchorPointerDown={(e) =>
                this.updateEditAnchor(e, 'bottom-left')
              }
              onBottomRightAnchorPointerDown={(e) =>
                this.updateEditAnchor(e, 'bottom-right')
              }
              onBottomAnchorPointerDown={(e) =>
                this.updateEditAnchor(e, 'bottom')
              }
              onLeftAnchorPointerDown={(e) => this.updateEditAnchor(e, 'left')}
              onRightAnchorPointerDown={(e) =>
                this.updateEditAnchor(e, 'right')
              }
              onCenterAnchorPointerDown={(e) =>
                this.updateEditAnchor(e, 'center')
              }
            />
          )}
        </svg>
      </Host>
    ) : (
      <Host />
    );
  }

  private async addInteractionListeners(
    viewer: HTMLVertexViewerElement
  ): Promise<void> {
    const interactionTarget = await viewer.getInteractionTarget();
    if (this.mode === 'replace') {
      interactionTarget.addEventListener('pointerdown', this.startMarkup);
    }
  }

  private async addDrawingInteractionListeners(): Promise<void> {
    if (this.mode !== '') {
      window.addEventListener('pointermove', this.updatePoints);
      window.addEventListener('pointerup', this.endMarkup);
    }
  }

  private async removeInteractionListeners(
    viewer: HTMLVertexViewerElement
  ): Promise<void> {
    const interactionTarget = await viewer.getInteractionTarget();
    interactionTarget.removeEventListener('pointerdown', this.startMarkup);
  }

  private async removeDrawingInteractionListeners(): Promise<void> {
    window.removeEventListener('pointermove', this.updatePoints);
    window.removeEventListener('pointerup', this.endMarkup);
  }

  private updateEditAnchor = (
    event: PointerEvent,
    anchor: BoundingBox2dAnchorPosition
  ): void => {
    this.resizeBounds = this.bounds;
    this.editAnchor = anchor;
    this.startMarkup(event);
  };

  private updatePoints = (event: PointerEvent): void => {
    if (this.bounds != null && this.startPosition != null) {
      const position = getMouseClientPosition(event, this.elementBounds);

      this.bounds = transformCircle(
        this.resizeBounds ?? this.bounds,
        this.startPosition,
        position,
        this.editAnchor
      );
    }
  };

  private startMarkup = (event: PointerEvent): void => {
    if (this.mode !== '') {
      const position = getMouseClientPosition(event, this.elementBounds);
      this.startPosition = position;
      this.bounds =
        this.bounds ?? Rectangle.create(position.x, position.y, 0, 0);
      this.editBegin.emit();
      this.addDrawingInteractionListeners();
    }
  };

  private endMarkup = (): void => {
    console.log('end');
    if (this.mode !== '') {
      this.editEnd.emit();
    }
    this.removeDrawingInteractionListeners();
  };
}
