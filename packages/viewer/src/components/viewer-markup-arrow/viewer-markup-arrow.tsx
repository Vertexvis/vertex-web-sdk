import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { Point } from '@vertexvis/geometry';

import { getMouseClientPosition } from '../../lib/dom';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  isValidPointData,
  isValidStartEvent,
  translatePointToRelative,
  translatePointToScreen,
} from '../viewer-markup/utils';
import { SvgShadow } from '../viewer-markup/viewer-markup-components';
import {
  arrowheadPointsToPolygonPoints,
  createArrowheadPoints,
  parsePoint,
} from './utils';
import { BoundingBox1d } from './viewer-markup-arrow-components';

/**
 * The supported arrow markup modes.
 *
 * @see {@link ViewerMarkupArrowMode.mode} - For more details about modes.
 */
export type ViewerMarkupArrowMode = 'edit' | 'create' | '';

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
   * to reposition them. When `create`, anytime the user clicks on the canvas,
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
   * An event that is dispatched when this markup element is in view
   * mode (`this.mode === ""`), and it completes a rerender.
   */
  @Event({ bubbles: true })
  public viewRendered!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private elementBounds?: DOMRect;

  @State()
  private editAnchor: ViewerMarkupArrowEditAnchor = 'end';

  private pointerId?: number;

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

    if (this.mode === 'create') {
      window.addEventListener('pointerdown', this.handleWindowPointerDown);
    }
  }

  protected componentDidRender(): void {
    if (this.mode === '') {
      this.viewRendered.emit();
    }
  }

  protected disconnectedCallback(): void {
    window.removeEventListener('pointerdown', this.handleWindowPointerDown);
  }

  @Method()
  public async dispose(): Promise<void> {
    if (this.viewer != null) {
      this.removeInteractionListeners(this.viewer);
    }
    this.removeDrawingInteractionListeners();
    window.removeEventListener('pointerdown', this.handleWindowPointerDown);
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

  @Watch('mode')
  protected handleModeChange(): void {
    if (this.mode !== 'create') {
      window.removeEventListener('pointerdown', this.handleWindowPointerDown);
    }
  }

  private updateViewport(): void {
    const rect = getMarkupBoundingClientRect(this.hostEl);
    this.elementBounds = rect;
  }

  private updatePointsFromProps(): void {
    this.start = this.start || parsePoint(this.startJson);
    this.end = this.end || parsePoint(this.endJson);
  }

  public render(): h.JSX.IntrinsicElements {
    if (this.start != null && this.end != null && this.elementBounds != null) {
      const screenStart = translatePointToScreen(
        this.start,
        this.elementBounds
      );
      const screenEnd = translatePointToScreen(this.end, this.elementBounds);
      const arrowheadPoints = createArrowheadPoints(screenStart, screenEnd);

      if (isValidPointData(screenStart, screenEnd)) {
        return (
          <Host>
            <svg class="svg" onTouchStart={this.handleTouchStart}>
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
                {this.mode === 'edit' && (
                  <line
                    id="bounding-box-1d-line"
                    class="bounds-line"
                    x1={screenStart.x}
                    y1={screenStart.y}
                    x2={screenEnd.x}
                    y2={screenEnd.y}
                  />
                )}
              </g>
            </svg>
            {this.mode === 'edit' && (
              <BoundingBox1d
                start={screenStart}
                end={screenEnd}
                onStartAnchorPointerDown={this.editStartPoint}
                onCenterAnchorPointerDown={this.editCenterPoint}
                onEndAnchorPointerDown={this.editEndPoint}
              />
            )}
            {this.mode === 'create' && (
              <div
                class="create-overlay"
                onTouchStart={this.handleTouchStart}
              ></div>
            )}
          </Host>
        );
      } else {
        return <Host></Host>;
      }
    } else {
      return (
        <Host>
          <div
            class="create-overlay"
            onTouchStart={this.handleTouchStart}
          ></div>
        </Host>
      );
    }
  }

  private async addInteractionListeners(
    viewer: HTMLVertexViewerElement
  ): Promise<void> {
    const interactionTarget = await viewer.getInteractionTarget();
    if (this.mode === 'create') {
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
    if (this.elementBounds != null && this.pointerId === event.pointerId) {
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

  private handleWindowPointerDown = (event: PointerEvent): void => {
    if (isValidStartEvent(event)) {
      this.startMarkup(event);
    }
  };

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();
  };

  private startMarkup = (event: PointerEvent): void => {
    if (
      this.mode !== '' &&
      this.elementBounds != null &&
      this.pointerId == null
    ) {
      this.pointerId = event.pointerId;
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

  private endMarkup = (event: PointerEvent): void => {
    if (this.pointerId === event.pointerId) {
      const screenStart =
        this.start != null && this.elementBounds != null
          ? translatePointToScreen(this.start, this.elementBounds)
          : undefined;
      const screenEnd =
        this.end != null && this.elementBounds != null
          ? translatePointToScreen(this.end, this.elementBounds)
          : undefined;

      if (
        this.mode !== '' &&
        screenStart != null &&
        screenEnd != null &&
        Point.distance(screenStart, screenEnd) >= 2
      ) {
        this.editEnd.emit();
      } else {
        this.start = undefined;
        this.end = undefined;
      }

      this.pointerId = undefined;
      this.removeDrawingInteractionListeners();
    }
  };
}
