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
import { Disposable } from '@vertexvis/utils';

import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  isValidPointData,
  isValidStartEvent,
  translatePointToScreen,
} from '../viewer-markup/utils';
import { SvgShadow } from '../viewer-markup/viewer-markup-components';
import { ArrowMarkupInteractionHandler } from './interactions';
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
  private hostEl!: HTMLVertexViewerMarkupArrowElement;

  @State()
  private elementBounds?: DOMRect;

  private interactionHandler = new ArrowMarkupInteractionHandler(
    this.hostEl,
    this.editBegin,
    this.editEnd
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
                onStartAnchorPointerDown={(event) =>
                  this.interactionHandler.editAnchor('start', event)
                }
                onCenterAnchorPointerDown={(event) =>
                  this.interactionHandler.editAnchor('center', event)
                }
                onEndAnchorPointerDown={(event) =>
                  this.interactionHandler.editAnchor('end', event)
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

  private handleWindowPointerDown = (event: PointerEvent): void => {
    if (isValidStartEvent(event)) {
      this.interactionHandler.startInteraction(event);
    }
  };

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();
  };
}
