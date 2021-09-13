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
import { Point, Rectangle } from '@vertexvis/geometry';
import { getMouseClientPosition } from '../../lib/dom';
import {
  translateRectToScreen,
  translatePointToRelative,
  translatePointToScreen,
  toRelativeScaleFactor,
  BoundingBox2dAnchorPosition,
  convertPointsToBounds,
} from '../viewer-markup/utils';
import { SvgShadow } from '../viewer-markup/viewer-markup-components';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  isCurve,
  parsePoints,
  smoothPointsCurve,
  smoothPointsRollingAvg,
  smoothPointsSignificant,
  toCurvePath,
  toPath,
} from './utils';
import { BoundingBox2d } from '../viewer-markup-circle/viewer-markup-circle-components';
import { transformCircle } from '../viewer-markup-circle/utils';

/**
 * The supported markup modes.
 *
 * @see {@link ViewerMarkupFreeformMode.mode} - For more details about modes.
 */
export type ViewerMarkupFreeformMode = 'edit' | 'create' | '';

@Component({
  tag: 'vertex-viewer-markup-freeform',
  styleUrl: 'viewer-markup-freeform.css',
  shadow: true,
})
export class ViewerMarkupFreeform {
  @Prop({ mutable: true, attribute: null })
  public points?: Point.Point[];

  @Prop({ attribute: 'points' })
  public pointsJson?: string;

  @Prop({ mutable: true })
  public path?: string;

  @Prop({ mutable: true })
  public bounds?: Rectangle.Rectangle;

  /**
   * A mode that specifies how the markup component should behave. When
   * unset, the component will not respond to interactions with the handles.
   * When `edit`, the markup anchors are interactive and the user is able
   * to reposition them. When `create`, anytime the user clicks on the canvas,
   * a new markup will be performed.
   */
  @Prop({ reflect: true })
  public mode: ViewerMarkupFreeformMode = '';

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
  private startPosition?: Point.Point;

  @State()
  private lastPosition?: Point.Point;

  @State()
  private lastClientPosition?: Point.Point;

  @State()
  private pendingPoints: Point.Point[] = [];

  @State()
  private editAnchor: BoundingBox2dAnchorPosition = 'bottom-right';

  @State()
  private resizeBounds?: Rectangle.Rectangle;

  @State()
  private resizePoints?: Point.Point[];

  private min?: Point.Point;
  private max?: Point.Point;

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

  @Watch('points')
  protected handlePointsJsonChange(): void {
    this.updatePointsFromProps();
  }

  private updateViewport(): void {
    const rect = getMarkupBoundingClientRect(this.hostEl);
    this.elementBounds = rect;
  }

  private updatePointsFromProps(): void {
    this.points = this.points ?? parsePoints(this.pointsJson);
  }

  public render(): h.JSX.IntrinsicElements {
    if (
      this.points != null &&
      this.points.length > 0 &&
      this.bounds != null &&
      this.elementBounds != null
    ) {
      const withStart =
        this.startPosition != null
          ? [this.startPosition, ...this.points]
          : this.points;
      const withLast =
        this.lastPosition != null
          ? [...withStart, this.lastPosition]
          : this.points;
      const relativePoints = smoothPointsSignificant(
        withLast
          .map((pt) => translatePointToScreen(pt, this.elementBounds!))
          .map((pt) =>
            Point.create(
              parseFloat(pt.x.toFixed(1)),
              parseFloat(pt.y.toFixed(1))
            )
          )
      );
      const relativeBounds = translateRectToScreen(
        this.bounds,
        this.elementBounds
      );
      const path = relativePoints.reduce(
        (d, pt) => `${d}L${pt.x},${pt.y}`,
        `M${relativePoints[0].x},${relativePoints[0].y}`
      );

      return (
        <Host>
          <svg class="svg">
            <path
              class="path"
              d={path}
              stroke="#0000ff"
              stroke-width={3}
              fill="none"
            />
            {/* {relativePoints.map((pt) => (
              <rect
                x={pt.x}
                y={pt.y}
                width={4}
                height={4}
                stroke="#000000"
                stroke-width="2"
                stroke-opacity="0.25"
                fill-opacity="0.2"
              />
            ))} */}
          </svg>
          {this.mode === 'edit' && (
            <BoundingBox2d
              bounds={relativeBounds}
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
        </Host>
      );
    } else {
      return (
        <Host>
          <div
            class="create-overlay"
            onPointerDown={(event) => this.startMarkup(event)}
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

  private async addEditingInteractionListeners(): Promise<void> {
    if (this.mode === 'edit') {
      window.addEventListener('pointermove', this.updateBounds);
      window.addEventListener('pointerup', this.endEdit);
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

  private async removeEditingInteractionListeners(): Promise<void> {
    if (this.mode === 'edit') {
      window.removeEventListener('pointermove', this.updateBounds);
      window.removeEventListener('pointerup', this.endEdit);
    }
  }

  private updateEditAnchor = (
    event: PointerEvent,
    anchor: BoundingBox2dAnchorPosition
  ): void => {
    if (this.elementBounds != null) {
      this.resizeBounds = this.bounds;
      this.resizePoints = this.points;
      this.editAnchor = anchor;
      this.startPosition = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
      this.addEditingInteractionListeners();
    }
    // this.startMarkup(event);
  };

  private updateBounds = (event: PointerEvent): void => {
    // console.log(this.startPosition, this.elementBounds, this.resizeBounds);
    if (
      this.startPosition != null &&
      this.elementBounds != null &&
      this.resizeBounds != null &&
      this.resizePoints != null
    ) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );

      const updatedBounds = transformCircle(
        this.resizeBounds,
        this.startPosition,
        position,
        this.editAnchor,
        event.shiftKey
      );
      this.points = convertPointsToBounds(
        this.resizePoints,
        this.resizeBounds,
        updatedBounds,
        this.startPosition,
        position,
        this.elementBounds
      );
      this.bounds = updatedBounds;
    }
  };

  private updatePoints = (event: PointerEvent): void => {
    if (
      this.points != null &&
      this.lastPosition != null &&
      this.lastClientPosition != null &&
      this.elementBounds != null
    ) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
      const clientPosition = Point.create(event.clientX, event.clientY);

      if (
        Math.abs(clientPosition.x - this.lastClientPosition.x) > 1 &&
        Math.abs(clientPosition.y - this.lastClientPosition.y) > 1
      ) {
        this.points = [...this.points, position];
        this.lastClientPosition = clientPosition;

        this.min =
          this.min != null
            ? Point.create(
                Math.min(this.min.x, position.x),
                Math.min(this.min.y, position.y)
              )
            : position;
        this.max =
          this.max != null
            ? Point.create(
                Math.max(this.max.x, position.x),
                Math.max(this.max.y, position.y)
              )
            : position;
        this.bounds = Rectangle.create(
          this.min.x,
          this.min.y,
          this.max.x - this.min.x,
          this.max.y - this.min.y
        );
      }

      this.lastPosition = position;
    }
  };

  private startMarkup = (event: PointerEvent): void => {
    if (this.mode !== '' && this.elementBounds != null) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
      this.lastClientPosition = Point.create(event.clientX, event.clientY);
      this.lastPosition = position;
      this.startPosition = position;
      this.min = position;
      this.max = position;
      this.points = this.points ?? [position];
      this.editBegin.emit();
      this.addDrawingInteractionListeners();
    }
  };

  private endMarkup = (event: PointerEvent): void => {
    if (this.mode !== '' && this.points != null && this.points.length > 0) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds!
      );

      this.points = [...this.points, position];
      this.editEnd.emit();
    } else {
      this.points = undefined;
      this.editCancel.emit();
    }

    this.min = undefined;
    this.max = undefined;
    this.removeDrawingInteractionListeners();
  };

  private endEdit = (event: PointerEvent): void => {
    this.resizeBounds = undefined;
    this.removeEditingInteractionListeners();
    this.editEnd.emit();
  };
}
