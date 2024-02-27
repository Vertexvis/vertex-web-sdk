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
import { Disposable } from '@vertexvis/utils';

import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  isValidStartEvent,
  translatePointToScreen,
  translateRectToScreen,
} from '../viewer-markup/markup-utils';
import { SvgShadow } from '../viewer-markup/viewer-markup-components';
import { parseBounds } from '../viewer-markup-circle/utils';
import { BoundingBox2d } from '../viewer-markup-circle/viewer-markup-circle-components';
import { FreeformMarkupInteractionHandler } from './interactions';
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
   * An event that is dispatched with the updated markup element after the markup has changed.
   */
  @Event({ bubbles: true })
  public markupUpdated!: EventEmitter<HTMLVertexViewerMarkupFreeformElement>;

  /**
   * An event that is dispatched when this markup element is in view
   * mode (`this.mode === ""`), and it completes a rerender.
   */
  @Event({ bubbles: true })
  public viewRendered!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLVertexViewerMarkupFreeformElement;

  @State()
  private elementBounds?: DOMRect;

  @State()
  private screenPoints: Point.Point[] = [];

  private interactionHandler = new FreeformMarkupInteractionHandler(
    this.hostEl,
    this.editBegin,
    this.editEnd,
    this.markupUpdated
  );

  private registeredInteraction?: Disposable;

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

  protected componentDidRender(): void {
    if (this.mode === '') {
      this.viewRendered.emit();
    }
  }

  protected disconnectedCallback(): void {
    this.dispose();
  }

  @Method()
  public async dispose(): Promise<void> {
    this.registeredInteraction?.dispose();
    this.registeredInteraction = undefined;

    window.removeEventListener('pointerdown', this.handleWindowPointerDown);
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected async handleViewerChanged(
    newViewer?: HTMLVertexViewerElement
  ): Promise<void> {
    this.registeredInteraction?.dispose();
    this.registeredInteraction = undefined;

    if (newViewer != null) {
      this.registeredInteraction = await newViewer.registerInteractionHandler(
        this.interactionHandler
      );
    }
  }

  @Watch('points')
  protected handlePointsChange(): void {
    this.updatePointsFromProps();
  }

  @Watch('bounds')
  protected handleBoundsChange(): void {
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
          <svg class="svg" onTouchStart={this.handleTouchStart}>
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
                this.interactionHandler.editAnchor('top-left', e)
              }
              onTopRightAnchorPointerDown={(e) =>
                this.interactionHandler.editAnchor('top-right', e)
              }
              onTopAnchorPointerDown={(e) =>
                this.interactionHandler.editAnchor('top', e)
              }
              onBottomLeftAnchorPointerDown={(e) =>
                this.interactionHandler.editAnchor('bottom-left', e)
              }
              onBottomRightAnchorPointerDown={(e) =>
                this.interactionHandler.editAnchor('bottom-right', e)
              }
              onBottomAnchorPointerDown={(e) =>
                this.interactionHandler.editAnchor('bottom', e)
              }
              onLeftAnchorPointerDown={(e) =>
                this.interactionHandler.editAnchor('left', e)
              }
              onRightAnchorPointerDown={(e) =>
                this.interactionHandler.editAnchor('right', e)
              }
              onCenterAnchorPointerDown={(e) =>
                this.interactionHandler.editAnchor('center', e)
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

  private handleWindowPointerDown = (event: PointerEvent): void => {
    if (isValidStartEvent(event)) {
      this.interactionHandler.startInteraction(event);
    }
  };

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();
  };

  private convertPointsToScreen(): Point.Point[] | undefined {
    const elementBounds = this.elementBounds;
    if (elementBounds != null) {
      return this.points?.map((pt) =>
        translatePointToScreen(pt, elementBounds)
      );
    }
  }
}
