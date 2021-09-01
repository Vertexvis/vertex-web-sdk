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
import { Matrix, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import { getMouseClientPosition } from '../../lib/dom';
import { Viewport } from '../../lib/types';
import { ArrowMarkup, Markup } from '../../lib/types/markup';
import { ViewerMarkupToolType } from '../viewer-markup-tool/viewer-markup-tool';
import {
  createArrowheadPoints,
  arrowheadPointsToPolygonPoints,
  parsePoint,
} from './utils';

/**
 * The supported markup modes.
 *
 * @see {@link ViewerMarkupArrowMode.mode} - For more details about modes.
 */
export type ViewerMarkupArrowMode = 'edit' | 'replace' | '';

@Component({
  tag: 'vertex-viewer-markup-arrow',
  styleUrl: 'viewer-markup-arrow.css',
  shadow: true,
})
export class ViewerMarkupArrow {
  /**
   * The position of the starting anchor. Can either be an instance of a
   * `Point` or a JSON string representation in the format of `[x, y]` or
   * `{"x": 0, "y": 0}`.
   */
  @Prop({ mutable: true, attribute: null })
  public start?: Point.Point;

  /**
   * The position of the starting anchor, as a JSON string. Can either be an
   * instance of a `Point` or a JSON string representation in the format of
   * `[x, y]` or `{"x": 0, "y": 0}`.
   */
  @Prop({ attribute: 'start' })
  public startJson?: string;

  /**
   * The position of the ending anchor. Can either be an instance of a `Point`
   * or a JSON string representation in the format of `[x, y]` or `{"x": 0,
   * "y": 0}`.
   */
  @Prop({ mutable: true })
  public end?: Point.Point;

  /**
   * The position of the ending anchor, as a JSON string. Can either be an
   * instance of a `Point` or a JSON string representation in the format of
   * `[x, y]` or `{"x": 0, "y": 0}`.
   */
  @Prop({ attribute: 'end' })
  public endJson?: string;

  /**
   * A mode that specifies how the measurement component should behave. When
   * unset, the component will not respond to interactions with the handles.
   * When `edit`, the measurement anchors are interactive and the user is able
   * to reposition them. When `replace`, anytime the user clicks on the canvas,
   * a new measurement will be performed.
   */
  @Prop({ reflect: true })
  public mode: ViewerMarkupArrowMode = '';

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

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.updateViewport();

    this.handleViewerChanged(this.viewer);

    this.updatePointsFromProps();
  }

  protected componentDidLoad(): void {
    this.updatePointsFromProps();

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

  @Watch('start')
  protected handleStartJsonChange(): void {
    this.updatePointsFromProps();
  }

  @Watch('end')
  protected handleEndJsonChange(): void {
    this.updatePointsFromProps();
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

  private updatePointsFromProps(): void {
    this.start = this.start || parsePoint(this.startJson);
    this.end = this.end || parsePoint(this.endJson);
  }

  public render(): h.JSX.IntrinsicElements {
    const arrowheadPoints =
      this.start != null && this.end != null
        ? createArrowheadPoints(this.start, this.end)
        : undefined;

    console.log(this.start, this.end);

    return this.start != null && arrowheadPoints != null ? (
      <Host>
        <svg class="svg">
          <g>
            <polygon
              class="head"
              points={arrowheadPointsToPolygonPoints(arrowheadPoints)}
              stroke={'#00ff00'}
              stroke-width={4}
              fill={'#00ff00'}
              fill-opacity={1}
            />
            <line
              class="line"
              x1={this.start.x}
              y1={this.start.y}
              x2={arrowheadPoints.base.x}
              y2={arrowheadPoints.base.y}
              stroke={'#00ff00'}
              stroke-width={4}
              fill={'#00ff00'}
              fill-opacity={0}
            />
          </g>
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
    if (this.drawing) {
      // event.preventDefault();
      // event.stopImmediatePropagation();
      this.end = getMouseClientPosition(event, this.elementBounds);
      this.start = this.start ?? this.end;
    }
  };

  private startMarkup = (event: PointerEvent): void => {
    if (this.mode === 'replace') {
      console.log(event);
      // event.preventDefault();
      // event.stopImmediatePropagation();
      this.start = getMouseClientPosition(event, this.elementBounds);
      this.drawing = true;
      this.editBegin.emit();
      this.hostEl.addEventListener('pointerup', this.endMarkup);
    }
  };

  private endMarkup = (event: PointerEvent): void => {
    if (this.drawing) {
      this.end = getMouseClientPosition(event, this.elementBounds);
      this.drawing = false;
      console.log('emitting edit end');
      this.editEnd.emit();
      this.hostEl.removeEventListener('pointerup', this.endMarkup);
    }
  };

  private reset = (): void => {
    // this.start = undefined;
    // this.end = undefined;
    // this.drawing = false;
  };
}
