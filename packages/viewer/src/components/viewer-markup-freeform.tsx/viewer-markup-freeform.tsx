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
import { Point, Rectangle } from '@vertexvis/geometry';

import { getMouseClientPosition } from '../../lib/dom';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  BoundingBox2dAnchorPosition,
  isVertexViewerMarkupElement,
  transformRectangle,
  translatePointsToBounds,
  translatePointToRelative,
  translatePointToScreen,
  translateRectToScreen,
} from '../viewer-markup/utils';
import { SvgShadow } from '../viewer-markup/viewer-markup-components';
import { parseBounds } from '../viewer-markup-circle/utils';
import { BoundingBox2d } from '../viewer-markup-circle/viewer-markup-circle-components';
import { parsePoints } from './utils';

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
  /**
   * The positions of the various points of this freeform markup. Can either be an array of
   * `Point`s or a JSON string representation in the format of `[[x1, y1], [x2, y2]]` or
   * `[{"x": 0, "y": 0}, {"x": 0, "y": 0}]`.
   *
   * Points are expected to be relative coordinates from `[-0.5, 0.5]`,
   * e.g. `[0, 0]` corresponds to a point in the center of the viewport.
   */
  @Prop({ mutable: true, attribute: null })
  public points?: Point.Point[];

  /**
   * The positions of the various points of this freeform markup. Can either be an array of
   * `Point`s or a JSON string representation in the format of `[[x1, y1], [x2, y2]]` or
   * `[{"x": 0, "y": 0}, {"x": 0, "y": 0}]`.
   *
   * Points are expected to be relative coordinates from `[-0.5, 0.5]`,
   * e.g. `[0, 0]` corresponds to a point in the center of the viewport.
   */
  @Prop({ attribute: 'points' })
  public pointsJson?: string;

  /**
   * The bounds of the freeform. Can either be an instance of a `Rectangle` or
   * a JSON string representation in the format of `[x, y, width, height]` or
   * `{"x": 0, "y": 0, "width": 10, "height": 10}`.
   *
   * Bounds are expected to have relative coordinates, with `[x, y]` from `[-0.5, 0.5]`
   * and `[width, height]` from `[0, 1]`, e.g. `[0, 0, 0.25, 0.25]`corresponds to a freeform
   * with a diameter of one fourth the viewport's smallest size in the center of the viewport.
   */
  @Prop({ mutable: true, attribute: null })
  public bounds?: Rectangle.Rectangle;

  /**
   * The bounds of the freeform. Can either be an instance of a `Rectangle` or
   * a JSON string representation in the format of `[x, y, width, height]` or
   * `{"x": 0, "y": 0, "width": 0.1, "height": 0.1}`.
   *
   * Bounds are expected to have relative coordinates, with `[x, y]` from `[-0.5, 0.5]`
   * and `[width, height]` from `[0, 1]`, e.g. `[0, 0, 0.25, 0.25]`corresponds to a freeform
   * with a diameter of one fourth the viewport's smallest size in the center of the viewport.
   */
  @Prop({ attribute: 'bounds' })
  public boundsJson?: string;

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
  private resizeStartPosition?: Point.Point;

  @State()
  private editAnchor: BoundingBox2dAnchorPosition = 'bottom-right';

  @State()
  private resizeBounds?: Rectangle.Rectangle;

  @State()
  private resizePoints?: Point.Point[];

  @State()
  private screenPoints: Point.Point[] = [];

  private min?: Point.Point;
  private max?: Point.Point;
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
    const resize = new ResizeObserver(() => this.updateViewport());
    resize.observe(this.hostEl);

    if (this.mode === 'create') {
      window.addEventListener('pointerdown', this.handleWindowPointerDown);
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

  @Watch('points')
  protected handlePointsJsonChange(): void {
    this.updatePointsFromProps();
  }

  @Watch('bounds')
  protected handleBoundsJsonChange(): void {
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
    this.screenPoints = this.convertPointsToScreen() ?? this.screenPoints;
  }

  private updatePointsFromProps(): void {
    this.points = this.points ?? parsePoints(this.pointsJson);
    this.screenPoints = this.convertPointsToScreen() ?? [];
    this.bounds = this.bounds ?? parseBounds(this.boundsJson);
  }

  public render(): h.JSX.IntrinsicElements {
    if (this.screenPoints.length > 0 && this.elementBounds != null) {
      return (
        <Host>
          <svg class="svg" onTouchStart={(event) => event.preventDefault()}>
            <defs>
              <SvgShadow id="freeform-markup-shadow" />
            </defs>
            <g filter="url(#freeform-markup-shadow)">
              <path
                class="path"
                d={this.screenPoints.reduce(
                  (d, pt) => `${d}L${pt.x},${pt.y}`,
                  `M${this.screenPoints[0].x},${this.screenPoints[0].y}`
                )}
                fill="none"
              />
            </g>
          </svg>
          {this.mode === 'edit' && this.bounds != null && (
            <BoundingBox2d
              bounds={translateRectToScreen(this.bounds, this.elementBounds)}
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
            onTouchStart={(event) => event.preventDefault()}
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

  private handleWindowPointerDown = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;
    if (isVertexViewerMarkupElement(target) && target.mode !== 'edit') {
      this.startMarkup(event);
    }
  };

  private updateEditAnchor = (
    event: PointerEvent,
    anchor: BoundingBox2dAnchorPosition
  ): void => {
    if (this.elementBounds != null) {
      this.resizeBounds = this.bounds;
      this.resizePoints = this.points;
      this.editAnchor = anchor;
      this.resizeStartPosition = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
      this.addEditingInteractionListeners();
    }
  };

  private updateBounds = (event: PointerEvent): void => {
    if (
      this.resizeStartPosition != null &&
      this.elementBounds != null &&
      this.resizeBounds != null &&
      this.resizePoints != null
    ) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );

      const updatedBounds = transformRectangle(
        this.resizeBounds,
        this.resizeStartPosition,
        position,
        this.editAnchor,
        event.shiftKey
      );
      this.points = translatePointsToBounds(
        this.resizePoints,
        this.resizeBounds,
        updatedBounds
      );
      this.screenPoints = this.convertPointsToScreen() ?? this.screenPoints;
      this.bounds = updatedBounds;
    }
  };

  private updatePoints = (event: PointerEvent): void => {
    if (
      this.pointerId === event.pointerId &&
      this.points != null &&
      this.elementBounds != null
    ) {
      const screenPosition = getMouseClientPosition(event, this.elementBounds);
      const position = translatePointToRelative(
        screenPosition,
        this.elementBounds
      );
      this.updateMinAndMax(position);
      this.points = [...this.points, position];
      this.screenPoints = [...this.screenPoints, screenPosition];
    }
  };

  private startMarkup = (event: PointerEvent): void => {
    if (
      this.pointerId == null &&
      this.mode !== '' &&
      this.elementBounds != null
    ) {
      this.pointerId = event.pointerId;
      const screenPosition = getMouseClientPosition(event, this.elementBounds);
      const position = translatePointToRelative(
        screenPosition,
        this.elementBounds
      );
      this.updateMinAndMax(position);
      this.points = this.points ?? [position];
      this.screenPoints = this.screenPoints ?? [screenPosition];
      this.editBegin.emit();
      this.addDrawingInteractionListeners();
    }
  };

  private endMarkup = (event: PointerEvent): void => {
    if (
      this.pointerId === event.pointerId &&
      this.mode !== '' &&
      this.points != null &&
      this.points.length > 1 &&
      this.elementBounds != null
    ) {
      const screenPosition = getMouseClientPosition(event, this.elementBounds);
      const position = translatePointToRelative(
        screenPosition,
        this.elementBounds
      );

      this.updateMinAndMax(position);

      this.points = [...this.points, position];
      this.screenPoints = [...this.screenPoints, screenPosition];

      this.editEnd.emit();
    } else if (this.mode === 'edit') {
      this.points = undefined;
      this.editCancel.emit();
    } else if (this.mode === 'create') {
      this.points = undefined;
    }

    this.min = undefined;
    this.max = undefined;
    this.pointerId = undefined;
    this.removeDrawingInteractionListeners();
  };

  private endEdit = (): void => {
    this.resizeBounds = undefined;
    this.removeEditingInteractionListeners();
    this.editEnd.emit();
  };

  private updateMinAndMax(position: Point.Point): void {
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

  private convertPointsToScreen(): Point.Point[] | undefined {
    const elementBounds = this.elementBounds;
    if (elementBounds != null) {
      return this.points?.map((pt) =>
        translatePointToScreen(pt, elementBounds)
      );
    }
  }
}
