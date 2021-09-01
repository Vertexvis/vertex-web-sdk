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
import { parseBounds } from './utils';

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

  @Listen('pointerup')
  protected handlePointerUp(event: PointerEvent): void {
    if (this.mode === 'replace') {
      this.endMarkup(event);
    }
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

    return this.bounds != null && center != null ? (
      <Host>
        <svg class="svg">
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={this.bounds.width / 2}
            ry={this.bounds.height / 2}
            stroke={'#000ff0'}
            stroke-width={4}
            fill={'none'}
          />
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
      interactionTarget.addEventListener('pointermove', this.updateEnd);
      interactionTarget.addEventListener('pointerdown', this.startMarkup);
      interactionTarget.addEventListener('pointerleave', this.reset);
      interactionTarget.addEventListener('pointerup', this.endMarkup);
    }
  }

  private async removeInteractionListeners(
    viewer: HTMLVertexViewerElement
  ): Promise<void> {
    const interactionTarget = await viewer.getInteractionTarget();
    interactionTarget.removeEventListener('pointermove', this.updateEnd);
    interactionTarget.removeEventListener('pointerdown', this.startMarkup);
    interactionTarget.removeEventListener('pointerleave', this.reset);
    interactionTarget.removeEventListener('pointerup', this.endMarkup);
  }

  private updateEnd = (event: PointerEvent): void => {
    if (this.drawing && this.bounds != null && this.startPosition != null) {
      // event.preventDefault();
      // event.stopImmediatePropagation();
      const position = getMouseClientPosition(event, this.elementBounds);

      const xDifference = position.x - (this.startPosition?.x ?? 0);
      const yDifference = position.y - (this.startPosition?.y ?? 0);

      this.bounds = Rectangle.create(
        xDifference < 0 ? position.x : this.bounds.x,
        yDifference < 0 ? position.y : this.bounds.y,
        xDifference < 0 ? this.startPosition.x - position.x : xDifference,
        yDifference < 0 ? this.startPosition.y - position.y : yDifference
      );

      console.log(this.bounds);

      // this.bounds = Rectangle.create(position.x, position.y);
      // this.startPosition = position;
    }
  };

  private startMarkup = (event: PointerEvent): void => {
    if (this.mode === 'replace') {
      console.log(event);
      // event.preventDefault();
      // event.stopImmediatePropagation();
      const position = getMouseClientPosition(event, this.elementBounds);
      this.bounds = Rectangle.create(position.x, position.y, 0, 0);
      this.drawing = true;
      this.editBegin.emit();
      this.hostEl.addEventListener('pointerup', this.endMarkup);
      this.startPosition = position;
    }
  };

  private endMarkup = (event: PointerEvent): void => {
    if (this.drawing) {
      this.drawing = false;
      console.log('emitting edit end');
      this.editEnd.emit();
      this.hostEl.removeEventListener('pointerup', this.endMarkup);
      this.startPosition = undefined;
    }
  };

  private reset = (): void => {
    // this.start = undefined;
    // this.end = undefined;
    // this.drawing = false;
  };
}
