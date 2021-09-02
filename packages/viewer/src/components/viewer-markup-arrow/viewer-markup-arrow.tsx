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
import { Point } from '@vertexvis/geometry';
import { getMouseClientPosition } from '../../lib/dom';
import { Viewport } from '../../lib/types';
import {
  createArrowheadPoints,
  arrowheadPointsToPolygonPoints,
  parsePoint,
} from './utils';
import { BoundingBox1d } from '../viewer-markup/viewer-markup-components';

/**
 * The supported markup modes.
 *
 * @see {@link ViewerMarkupArrowMode.mode} - For more details about modes.
 */
export type ViewerMarkupArrowMode = 'edit' | 'replace' | '';

type ViewerMarkupArrowEditAnchor = 'start' | 'end' | 'center';

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
  private editAnchor: ViewerMarkupArrowEditAnchor = 'end';

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

  private updateViewport(): void {
    const rect = this.hostEl.getBoundingClientRect();
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

    return this.start != null && this.end != null && arrowheadPoints != null ? (
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
          {this.mode === 'edit' && (
            <BoundingBox1d
              start={this.start}
              end={this.end}
              onStartAnchorPointerDown={this.editStartPoint}
              onCenterAnchorPointerDown={this.editCenterPoint}
              onEndAnchorPointerDown={this.editEndPoint}
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

  private editStartPoint = (event: PointerEvent): void => {
    this.editAnchor = 'start';
    this.startMarkup(event);
  };

  private editCenterPoint = (event: PointerEvent): void => {
    this.editAnchor = 'center';
    this.startMarkup(event);
  };

  private editEndPoint = (event: PointerEvent): void => {
    this.editAnchor = 'end';
    this.startMarkup(event);
  };

  private updatePoints = (event: PointerEvent): void => {
    const position = getMouseClientPosition(event, this.elementBounds);
    if (this.editAnchor === 'start') {
      this.start = position;
    } else if (this.editAnchor === 'end') {
      this.end = position;
    } else if (this.start != null && this.end != null) {
      const center = Point.create(
        (this.start.x + this.end.x) / 2,
        (this.start.y + this.end.y) / 2
      );
      const xDifference = center.x - position.x;
      const yDifference = center.y - position.y;

      this.start = Point.create(
        this.start.x - xDifference,
        this.start.y - yDifference
      );
      this.end = Point.create(
        this.end.x - xDifference,
        this.end.y - yDifference
      );
    }
  };

  private startMarkup = (event: PointerEvent): void => {
    if (this.mode !== '') {
      this.start =
        this.start ?? getMouseClientPosition(event, this.elementBounds);
      this.editBegin.emit();
      this.addDrawingInteractionListeners();
    }
  };

  private endMarkup = (): void => {
    if (this.mode !== '') {
      this.editEnd.emit();

      this.removeDrawingInteractionListeners();
    }
  };
}
