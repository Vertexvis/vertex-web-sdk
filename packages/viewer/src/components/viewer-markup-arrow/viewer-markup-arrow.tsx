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
import { Dimensions, Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import { getWindowDevicePixelRatio } from '../../lib/dom';
import { MarkupEnabledElement } from '../../lib/markup/types';
import { writeDOM } from '../../lib/stencil';
import {
  MarkupCenteringBehavior,
  MarkupInteraction,
} from '../../lib/types/markup';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import {
  isValidPointData,
  isValidStartEvent,
  translatePointToScreen,
} from '../viewer-markup/markup-utils';
import { SvgShadow } from '../viewer-markup/viewer-markup-components';
import { ArrowMarkupInteractionHandler } from './interactions';
import {
  arrowheadPointsToCirclePoints,
  arrowheadPointsToHashPoints,
  arrowheadPointsToPathPoints,
  arrowheadPointsToPolygonPoints,
  createLineAnchorStylePoints,
  LineAnchorStyle,
  LineAnchorStylePoints,
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
   * The original viewport dimensions where this markup was created. This value is used
   * to determine where the markup should be rendered relative to the current viewport,
   * enabling some markup to appear "off-screen".
   *
   * When provided, all NDC values will be considered relative to this viewport.
   */
  @Prop()
  public originatingViewport?: Dimensions.Dimensions;

  /**
   * Defines the behavior of the provided markup when the originating viewport is smaller
   * than the current viewport, or is scaled to a size smaller than the current viewport
   * using the `scale` property.
   *
   * Options:
   * - `x-only`: Markup will be centered horizontally, but not vertically.
   * - `y-only`: Markup will be centered vertically, but not horizontally.
   * - `both`: Markup will be centered both horizontally and vertically.
   * - `none`: Markup will not be centered (default).
   */
  @Prop()
  public centeringBehavior: MarkupCenteringBehavior = 'none';

  /**
   * The current offset of the visible viewport. This value is used to determine where
   * markup should be rendered relative to the current viewport, enabling some markup to appear "off-screen".
   *
   * When provided, all computed coordinates will be offset by this amount.
   */
  @Prop()
  public offset?: Point.Point;

  /**
   * The scale to render this markup at. This value is used to scale the element's bounds
   * along with any `offset` to determine the final computed coordinates.
   *
   * When provided, all computed coordinates will be scaled by this amount.
   */
  @Prop()
  public scale = 1;

  /**
   * The style of the starting anchor. This defaults to none.
   */
  @Prop({ mutable: true })
  public startLineAnchorStyle: LineAnchorStyle = 'none';

  /**
   * The style of the ending anchor. This defaults to 'arrow-triangle.'
   */
  @Prop({ mutable: true })
  public endLineAnchorStyle: LineAnchorStyle = 'arrow-triangle';

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
  public viewer?: MarkupEnabledElement;

  /**
   * An event that is dispatched anytime the user begins interacting with the
   * markup.
   */
  @Event({ bubbles: true })
  public interactionBegin!: EventEmitter<void>;

  /**
   * An event that is dispatched when the user has finished interacting with the
   * markup.
   */
  @Event({ bubbles: true })
  public interactionEnd!: EventEmitter<MarkupInteraction>;

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
    this.interactionBegin,
    this.interactionEnd,
    {
      scale: this.scale,
      offset: this.offset,
      originatingViewport: this.originatingViewport,
      centeringBehavior: this.centeringBehavior,
    }
  );

  private registeredInteraction?: Disposable;

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.updateViewport();
    this.handleViewerChanged(this.viewer);
    this.handleScaleChange();
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
    newViewer?: MarkupEnabledElement
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

  @Watch('offset')
  @Watch('originatingViewport')
  @Watch('centeringBehavior')
  @Watch('scale')
  protected handleScalingConfigurationChange(): void {
    this.interactionHandler.updateScalingOptions({
      scale: this.scale,
      offset: this.offset,
      originatingViewport: this.originatingViewport,
      centeringBehavior: this.centeringBehavior,
    });
  }

  @Watch('scale')
  protected handleScaleChange(): void {
    writeDOM(() => {
      this.hostEl.style.setProperty(
        '--viewer-markup-arrow-scale',
        this.scale?.toString() ?? '1'
      );
    });
  }

  private updateViewport(): void {
    const rect = getMarkupBoundingClientRect(this.hostEl);
    this.elementBounds = rect;
  }

  private updatePointsFromProps(): void {
    this.start = this.start || parsePoint(this.startJson);
    this.end = this.end || parsePoint(this.endJson);
  }

  private renderLineAnchorStyle(
    anchorStyle: LineAnchorStyle,
    arrowheadPoints: LineAnchorStylePoints
  ): h.JSX.IntrinsicElements {
    if (anchorStyle === 'arrow-triangle') {
      return (
        <polygon
          id="line-anchor-arrow-triangle"
          class="head"
          points={arrowheadPointsToPolygonPoints(arrowheadPoints, this.scale)}
        />
      );
    } else if (anchorStyle === 'arrow-line') {
      return (
        <path
          id="line-anchor-arrow-line"
          class="head"
          d={arrowheadPointsToPathPoints(arrowheadPoints, this.scale)}
        />
      );
    } else if (anchorStyle === 'hash') {
      const hashPoints = arrowheadPointsToHashPoints(
        arrowheadPoints,
        this.scale
      );

      return <line id="line-anchor-hash" class="head" {...hashPoints} />;
    } else if (anchorStyle === 'dot') {
      const circlePoints = arrowheadPointsToCirclePoints(
        arrowheadPoints,
        this.scale
      );

      return <circle id="line-anchor-circle" class="head" {...circlePoints} />;
    } else {
      return <div />;
    }
  }

  public render(): h.JSX.IntrinsicElements {
    if (this.start != null && this.end != null && this.elementBounds != null) {
      const elementBounds = this.elementBounds;
      const offsetX = (this.offset?.x ?? 0) / getWindowDevicePixelRatio();
      const offsetY = (this.offset?.y ?? 0) / getWindowDevicePixelRatio();
      const screenStart = translatePointToScreen(
        this.start,
        elementBounds,
        this.originatingViewport,
        this.centeringBehavior,
        this.scale
      );
      const screenEnd = translatePointToScreen(
        this.end,
        elementBounds,
        this.originatingViewport,
        this.centeringBehavior,
        this.scale
      );

      if (isValidPointData(screenStart, screenEnd)) {
        const arrowheadStartPoints = createLineAnchorStylePoints(
          screenEnd,
          screenStart
        );
        const arrowheadEndPoints = createLineAnchorStylePoints(
          screenStart,
          screenEnd
        );

        return (
          <Host>
            <svg class="svg" onTouchStart={this.handleTouchStart}>
              <defs>
                <SvgShadow id="arrow-shadow" scale={this.scale} />
              </defs>
              <g
                transform={`translate(${offsetX} ${offsetY})`}
                filter="url(#arrow-shadow)"
              >
                {this.renderLineAnchorStyle(
                  this.startLineAnchorStyle,
                  arrowheadStartPoints
                )}
                <line
                  id="arrow-line"
                  class="line"
                  x1={arrowheadEndPoints.tip.x}
                  y1={arrowheadEndPoints.tip.y}
                  x2={arrowheadStartPoints.tip.x}
                  y2={arrowheadStartPoints.tip.y}
                />
                {this.renderLineAnchorStyle(
                  this.endLineAnchorStyle,
                  arrowheadEndPoints
                )}
              </g>
              {this.mode === 'edit' && (
                <g transform={`translate(${offsetX} ${offsetY})`}>
                  <line
                    id="bounding-box-1d-line"
                    class="bounds-line"
                    x1={screenStart.x}
                    y1={screenStart.y}
                    x2={screenEnd.x}
                    y2={screenEnd.y}
                  />
                </g>
              )}
            </svg>
            {this.mode === 'edit' && (
              <BoundingBox1d
                start={screenStart}
                end={screenEnd}
                offset={{ x: offsetX, y: offsetY }}
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
