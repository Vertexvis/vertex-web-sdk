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
import { Rectangle } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  isValidStartEvent,
  translateRectToScreen,
} from '../viewer-markup/markup-utils';
import { SvgShadow } from '../viewer-markup/viewer-markup-components';
import { CircleMarkupInteractionHandler } from './interactions';
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
   * An event that is dispatched with the updated markup element after the markup has changed.
   */
  @Event({ bubbles: true })
  public markupUpdated!: EventEmitter<HTMLVertexViewerMarkupCircleElement>;

  /**
   * An event that is dispatched when this markup element is in view
   * mode (`this.mode === ""`), and it completes a rerender.
   */
  @Event({ bubbles: true })
  public viewRendered!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLVertexViewerMarkupCircleElement;

  @State()
  private elementBounds?: DOMRect;

  private interactionHandler = new CircleMarkupInteractionHandler(
    this.hostEl,
    this.editBegin,
    this.editEnd,
    this.markupUpdated
  );

  private registeredHandler?: Disposable;

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
    this.dispose();
  }

  @Method()
  public async dispose(): Promise<void> {
    this.registeredHandler?.dispose();
    this.registeredHandler = undefined;

    window.removeEventListener('pointerdown', this.handleWindowPointerDown);
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected async handleViewerChanged(
    newViewer?: HTMLVertexViewerElement
  ): Promise<void> {
    this.registeredHandler?.dispose();
    this.registeredHandler = undefined;

    if (newViewer != null) {
      this.registeredHandler = await newViewer.registerInteractionHandler(
        this.interactionHandler
      );
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
}
