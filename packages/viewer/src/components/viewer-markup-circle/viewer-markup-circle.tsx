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
  isValidStartEvent,
  transformRectangle,
  translatePointToRelative,
  translateRectToScreen,
} from '../viewer-markup/utils';
import { SvgShadow } from '../viewer-markup/viewer-markup-components';
import { parseBounds } from './utils';
import { BoundingBox2d } from './viewer-markup-circle-components';

/**
 * The supported markup modes.
 *
 * @see {@link ViewerMarkupCircleMode.mode} - For more details about modes.
 */
export type ViewerMarkupCircleMode = 'edit' | 'create' | '';

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
   * Bounds are expected to have relative coordinates, with `[x, y]` from `[-0.5, 0.5]`
   * and `[width, height]` from `[0, 1]`, e.g. `[0, 0, 0.25, 0.25]`corresponds to a circle
   * with a diameter of one fourth the viewport's smallest size in the center of the viewport.
   */
  @Prop({ mutable: true, attribute: null })
  public bounds?: Rectangle.Rectangle;

  /**
   * The bounds of the circle. Can either be an instance of a `Rectangle` or
   * a JSON string representation in the format of `[x, y, width, height]` or
   * `{"x": 0, "y": 0, "width": 0.1, "height": 0.1}`.
   *
   * Bounds are expected to have relative coordinates, with `[x, y]` from `[-0.5, 0.5]`
   * and `[width, height]` from `[0, 1]`, e.g. `[0, 0, 0.25, 0.25]`corresponds to a circle
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
  private startPosition?: Point.Point;

  @State()
  private editAnchor: BoundingBox2dAnchorPosition = 'bottom-right';

  @State()
  private resizeBounds?: Rectangle.Rectangle;

  private pointerId?: number;

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

  @Watch('bounds')
  protected handleBoundsJsonChange(): void {
    this.updateBoundsFromProps();
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

  private updateBoundsFromProps(): void {
    this.bounds = this.bounds ?? parseBounds(this.boundsJson);
  }

  public render(): h.JSX.IntrinsicElements {
    if (this.bounds != null && this.elementBounds != null) {
      const relativeBounds = translateRectToScreen(
        this.bounds,
        this.elementBounds
      );
      const center = Rectangle.center(relativeBounds);

      return (
        <Host>
          <svg class="svg" onTouchStart={this.handleTouchStart}>
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
          {this.mode === 'create' && (
            <div
              class="create-overlay"
              onTouchStart={this.handleTouchStart}
            ></div>
          )}
        </Host>
      );
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
      this.elementBounds != null &&
      this.pointerId === event.pointerId
    ) {
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );

      this.bounds = transformRectangle(
        this.resizeBounds ?? this.bounds,
        this.startPosition,
        position,
        this.editAnchor,
        event.shiftKey
      );
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
      const position = translatePointToRelative(
        getMouseClientPosition(event, this.elementBounds),
        this.elementBounds
      );
      this.pointerId = event.pointerId;
      this.startPosition = position;
      this.bounds =
        this.bounds ?? Rectangle.create(position.x, position.y, 0, 0);
      this.resizeBounds = this.bounds;
      this.editBegin.emit();
      this.addDrawingInteractionListeners();
    }
  };

  private endMarkup = (event: PointerEvent): void => {
    if (this.pointerId === event.pointerId) {
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
      }

      this.pointerId = undefined;
      this.removeDrawingInteractionListeners();
    }
  };
}
