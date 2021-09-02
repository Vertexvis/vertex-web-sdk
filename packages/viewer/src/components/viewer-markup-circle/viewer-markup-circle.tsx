import {
  Component,
  Host,
  h,
  Element,
  Prop,
  Watch,
  EventEmitter,
  Event,
  State,
} from '@stencil/core';
import { Point, Rectangle } from '@vertexvis/geometry';
import { DeviceSize, getDeviceSize } from '../../lib/device';
import { getMouseClientPosition } from '../../lib/dom';
import {
  BoundingBox2dAnchorPosition,
  translateRectToScreen,
  translatePointToRelative,
} from '../viewer-markup/utils';
import {
  BoundingBox2d,
  SvgShadow,
} from '../viewer-markup/viewer-markup-components';
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
   *
   * Bounds are expected to have relative coordinates, e.g. `[0.5, 0.5, 0.5, 0.5]`
   * corresponds to a circle with a diameter of half the viewport width in the
   * center of the viewport.
   */
  @Prop({ mutable: true, attribute: null })
  public bounds?: Rectangle.Rectangle;

  /**
   * The bounds of the circle. Can either be an instance of a `Rectangle` or
   * a JSON string representation in the format of `[x, y, width, height]` or
   * `{"x": 0, "y": 0, "width": 10, "height": 10}`.
   *
   * Bounds are expected to have relative coordinates, e.g. `[0.5, 0.5, 0.5, 0.5]`
   * corresponds to a circle with a diameter of half the viewport width in the
   * center of the viewport.
   */
  @Prop({ attribute: 'bounds' })
  public boundsJson?: string;

  /**
   * A mode that specifies how the markup component should behave. When
   * unset, the component will not respond to interactions with the handles.
   * When `edit`, the markup anchors are interactive and the user is able
   * to reposition them. When `replace`, anytime the user clicks on the canvas,
   * a new markup will be performed.
   */
  @Prop({ reflect: true })
  public mode: ViewerMarkupCircleMode = '';

  /**
   * The viewer to connect to markups.
   *
   * This property will automatically be set when a child of a
   * `<vertex-viewer-markup>` or `<vertex-viewer>` element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * An event that is dispatched anytime the user begins editing the
   * markup.
   */
  @Event({ bubbles: true })
  public editBegin!: EventEmitter<void>;

  /**
   * An event that is dispatched when the user has finished editing the
   * markup.
   */
  @Event({ bubbles: true })
  public editEnd!: EventEmitter<void>;

  /**
   * An event that is dispatched when the user cancels editing of the
   * markup.
   */
  @Event({ bubbles: true })
  public editCancel!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private elementBounds?: DOMRect;

  @State()
  private deviceSize?: DeviceSize;

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
    if (oldViewer != null) {
      this.removeInteractionListeners(oldViewer);
    }

    if (newViewer != null) {
      this.addInteractionListeners(newViewer);
    }
  }

  @Watch('bounds')
  protected handleBoundsJsonChange(): void {
    this.updateBoundsFromProps();
  }

  private updateViewport(): void {
    const rect = this.hostEl.getBoundingClientRect();
    this.deviceSize = getDeviceSize();
    this.elementBounds = rect;
  }

  private updateBoundsFromProps(): void {
    this.bounds = this.bounds ?? parseBounds(this.boundsJson);
  }

  public render(): h.JSX.IntrinsicElements {
    const relativeBounds =
      this.bounds != null && this.elementBounds != null
        ? translateRectToScreen(this.bounds, this.elementBounds)
        : this.bounds;
    const center = relativeBounds
      ? Rectangle.center(relativeBounds)
      : undefined;

    console.log(this.bounds, relativeBounds);

    return relativeBounds && center != null && this.deviceSize != null ? (
      <Host>
        <svg class="svg">
          <defs>
            <SvgShadow id="circle-shadow" />
          </defs>
          <g filter="url(#circle-shadow)">
            <ellipse
              class="ellipse"
              cx={center.x}
              cy={center.y}
              rx={relativeBounds.width / 2}
              ry={relativeBounds.height / 2}
              stroke={'#000ff0'}
              stroke-width={4}
              fill={'none'}
            />
          </g>
          {this.mode === 'edit' && (
            <BoundingBox2d
              bounds={relativeBounds}
              deviceSize={this.deviceSize}
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
    if (
      this.bounds != null &&
      this.startPosition != null &&
      this.elementBounds != null
    ) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );

      this.bounds = transformCircle(
        this.resizeBounds ?? this.bounds,
        this.startPosition,
        position,
        this.editAnchor
      );
    }
  };

  private startMarkup = (event: PointerEvent): void => {
    if (this.mode !== '' && this.elementBounds != null) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
      this.startPosition = position;
      this.bounds =
        this.bounds ?? Rectangle.create(position.x, position.y, 0, 0);
      this.resizeBounds = this.bounds;
      this.editBegin.emit();
      this.addDrawingInteractionListeners();
    }
  };

  private endMarkup = (): void => {
    if (
      this.mode !== '' &&
      this.bounds != null &&
      this.bounds?.width > 0 &&
      this.bounds?.height > 0
    ) {
      this.editAnchor = 'bottom-right';
      this.editEnd.emit();
    } else {
      this.bounds = undefined;
      this.editCancel.emit();
    }
    this.removeDrawingInteractionListeners();
  };
}
