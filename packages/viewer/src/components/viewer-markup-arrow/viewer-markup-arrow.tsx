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
  Method,
} from '@stencil/core';
import { Point } from '@vertexvis/geometry';
import { getMouseClientPosition } from '../../lib/dom';
import { getDeviceSize, DeviceSize } from '../../lib/device';
import {
  createArrowheadPoints,
  arrowheadPointsToPolygonPoints,
  parsePoint,
} from './utils';
import {
  BoundingBox1d,
  SvgShadow,
} from '../viewer-markup/viewer-markup-components';
import {
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';

/**
 * The supported arrow markup modes.
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
   *
   * Points are expected to be relative coordinates from `[-0.5, 0.5]`,
   * e.g. `[0, 0]` corresponds to a point in the center of the viewport.
   */
  @Prop({ mutable: true, attribute: null })
  public start?: Point.Point;

  /**
   * The position of the starting anchor, as a JSON string. Can either be an
   * instance of a `Point` or a JSON string representation in the format of
   * `[x, y]` or `{"x": 0, "y": 0}`.
   *
   * Points are expected to be relative coordinates from `[-0.5, 0.5]`,
   * e.g. `[0, 0]` corresponds to a point in the center of the viewport.
   */
  @Prop({ attribute: 'start' })
  public startJson?: string;

  /**
   * The position of the ending anchor. Can either be an instance of a `Point`
   * or a JSON string representation in the format of `[x, y]` or `{"x": 0,
   * "y": 0}`.
   *
   * Points are expected to be relative coordinates from `[-0.5, 0.5]`,
   * e.g. `[0, 0]` corresponds to a point in the center of the viewport.
   */
  @Prop({ mutable: true })
  public end?: Point.Point;

  /**
   * The position of the ending anchor, as a JSON string. Can either be an
   * instance of a `Point` or a JSON string representation in the format of
   * `[x, y]` or `{"x": 0, "y": 0}`.
   *
   * Points are expected to be relative coordinates from `[-0.5, 0.5]`,
   * e.g. `[0, 0]` corresponds to a point in the center of the viewport.
   */
  @Prop({ attribute: 'end' })
  public endJson?: string;

  /**
   * A mode that specifies how the markup component should behave. When
   * unset, the component will not respond to interactions with the handles.
   * When `edit`, the markup anchors are interactive and the user is able
   * to reposition them. When `replace`, anytime the user clicks on the canvas,
   * a new markup will be performed.
   */
  @Prop({ reflect: true })
  public mode: ViewerMarkupArrowMode = '';

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

  @Method()
  public async dispose(): Promise<void> {
    if (this.viewer != null) {
      this.removeInteractionListeners(this.viewer);
    }
    this.removeDrawingInteractionListeners();
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

  @Watch('start')
  protected handleStartJsonChange(): void {
    this.updatePointsFromProps();
  }

  @Watch('end')
  protected handleEndJsonChange(): void {
    this.updatePointsFromProps();
  }

  private updateViewport(): void {
    const rect = getMarkupBoundingClientRect(this.hostEl);
    this.deviceSize = getDeviceSize();
    this.elementBounds = rect;
  }

  private updatePointsFromProps(): void {
    this.start = this.start || parsePoint(this.startJson);
    this.end = this.end || parsePoint(this.endJson);
  }

  public render(): h.JSX.IntrinsicElements {
    if (
      this.start != null &&
      this.end != null &&
      this.deviceSize != null &&
      this.elementBounds != null
    ) {
      const screenStart = translatePointToScreen(
        this.start,
        this.elementBounds
      );
      const screenEnd = translatePointToScreen(this.end, this.elementBounds);
      const arrowheadPoints = createArrowheadPoints(screenStart, screenEnd);

      return (
        <Host>
          <svg class="svg">
            <defs>
              <SvgShadow id="arrow-shadow" />
            </defs>
            <g filter="url(#arrow-shadow)">
              <polygon
                id="arrow-head"
                class="head"
                points={arrowheadPointsToPolygonPoints(arrowheadPoints)}
              />
              <line
                id="arrow-line"
                class="line"
                x1={screenStart.x}
                y1={screenStart.y}
                x2={arrowheadPoints.base.x}
                y2={arrowheadPoints.base.y}
              />
            </g>
            {this.mode === 'edit' && (
              <BoundingBox1d
                start={screenStart}
                end={screenEnd}
                deviceSize={this.deviceSize}
                onStartAnchorPointerDown={this.editStartPoint}
                onCenterAnchorPointerDown={this.editCenterPoint}
                onEndAnchorPointerDown={this.editEndPoint}
              />
            )}
          </svg>
        </Host>
      );
    } else {
      return <Host />;
    }
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
    if (this.elementBounds != null) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
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
    }
  };

  private startMarkup = (event: PointerEvent): void => {
    if (this.mode !== '' && this.elementBounds != null) {
      this.start =
        this.start ??
        translatePointToRelative(
          getMouseClientPosition(event, this.elementBounds),
          this.elementBounds
        );
      this.editBegin.emit();
      this.addDrawingInteractionListeners();
    }
  };

  private endMarkup = (): void => {
    if (this.mode !== '' && this.end != null) {
      this.editEnd.emit();
    } else {
      this.start = undefined;
      this.editCancel.emit();
    }

    this.removeDrawingInteractionListeners();
  };
}
