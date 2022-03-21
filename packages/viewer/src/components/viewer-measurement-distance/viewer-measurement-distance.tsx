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
import { Line3, Point, Vector3 } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';

import {
  MEASUREMENT_LINE_CAP_LENGTH,
  MEASUREMENT_SNAP_DISTANCE,
} from '../../lib/constants';
import { Cursor, measurementCursor } from '../../lib/cursors';
import { getMouseClientPosition } from '../../lib/dom';
import { Formatter } from '../../lib/formatter';
import {
  makeMinimumDistanceResult,
  MeasurementModel,
  MeasurementOverlay,
  MeasurementOverlayManager,
} from '../../lib/measurement';
import {
  DepthBuffer,
  DistanceUnits,
  DistanceUnitType,
  FramePerspectiveCamera,
  StencilBuffer,
  Viewport,
} from '../../lib/types';
import { getMeasurementBoundingClientRect } from './dom';
import { PointToPointHitTester } from './hitTest';
import {
  PointToPointHitProvider,
  PointToPointInteraction,
  PointToPointInteractionController,
  PointToPointInteractionModel,
} from './interactions';
import {
  Anchor,
  getViewingElementPositions,
  MeasurementElementPositions,
} from './utils';
import { DistanceMeasurementRenderer } from './viewer-measurement-distance-components';

/**
 * Contains the bounding boxes of child elements of this component. This
 * information is useful for positioning popups or other elements around the
 * measurement.
 *
 * @see {@link ViewerDistanceMeasurement.computeElementMetrics} - For
 * calculating element metrics.
 */
export interface ViewerMeasurementDistanceElementMetrics {
  startAnchor: DOMRect;
  endAnchor: DOMRect;
  label: DOMRect;
}

/**
 * The supported measurement modes.
 *
 * @see {@link ViewerDistanceMeasurement.mode} - For more details about modes.
 */
export type ViewerMeasurementDistanceMode = 'edit' | 'replace' | '';

/**
 * A details object describing the edit begin event.
 */
export interface EditBeginEventDetails {
  type: Exclude<ViewerMeasurementDistanceMode, ''>;
  anchor: Anchor;
}
/**
 * A details object describing the edit end event.
 */
export interface EditEndEventDetails {
  start: Vector3.Vector3;
  end: Vector3.Vector3;
  valid: boolean;
}

interface StateMap {
  hoverCursor?: Disposable;
  stencil?: StencilBuffer;
  depthBuffer?: DepthBuffer;
}

const INTERACTION_THRESHOLD = 3;

/**
 * @slot start-anchor - An HTML element for the starting point anchor.
 *
 * @slot start-label - An HTML or text element that displays next to the start
 * anchor.
 *
 * @slot end-anchor - An HTML element for the ending point anchor.
 *
 * @slot end-label - An HTML or text element that displays next to the end
 * anchor.
 *
 * @slot indicator - An HTML element for the measurement indicator. The
 * indicator represents the position where a measurement will be placed while
 * editing.
 */
@Component({
  tag: 'vertex-viewer-measurement-distance',
  styleUrl: 'viewer-measurement-distance.css',
  shadow: true,
})
export class ViewerMeasurementDistance {
  /**
   * The position of the starting anchor. Can either be an instance of a
   * `Vector3` or a JSON string representation in the format of `[x, y, z]` or
   * `{"x": 0, "y": 0, "z": 0}`.
   */
  @Prop({ mutable: true })
  public start?: Vector3.Vector3;

  /**
   * The position of the starting anchor, as a JSON string. Can either be an
   * instance of a `Vector3` or a JSON string representation in the format of
   * `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.
   */
  @Prop()
  public startJson?: string;

  /**
   * The position of the ending anchor. Can either be an instance of a `Vector3`
   * or a JSON string representation in the format of `[x, y, z]` or `{"x": 0,
   * "y": 0, "z": 0}`.
   */
  @Prop({ mutable: true })
  public end?: Vector3.Vector3;

  /**
   * The position of the ending anchor, as a JSON string. Can either be an
   * instance of a `Vector3` or a JSON string representation in the format of
   * `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.
   */
  @Prop()
  public endJson?: string;

  /**
   * The distance between `start` and `end` in real world units. Value will be
   * undefined if the start and end positions are undefined, or if the
   * measurement is invalid.
   */
  @Prop({ mutable: true })
  public distance?: number;

  /**
   * Enables the display of axis reference lines between the start and end
   * point.
   */
  @Prop()
  public showAxisReferenceLines = false;

  /**
   * The distance, in pixels, between the mouse and nearest snappable edge. A
   * value of 0 disables snapping.
   */
  @Prop()
  public snapDistance: number = MEASUREMENT_SNAP_DISTANCE;

  /**
   * The unit of measurement.
   */
  @Prop()
  public units: DistanceUnitType = 'millimeters';

  /**
   * The number of fraction digits to display.
   */
  @Prop()
  public fractionalDigits = 2;

  /**
   * An optional formatter that can be used to format the display of a distance.
   * The formatting function is passed a calculated real-world distance and is
   * expected to return a string.
   */
  @Prop()
  public labelFormatter?: Formatter<number | undefined>;

  /**
   * The distance from an anchor to its label.
   */
  @Prop()
  public anchorLabelOffset = 20;

  /**
   * The length of the caps at each end of the distance measurement.
   */
  @Prop()
  public lineCapLength = MEASUREMENT_LINE_CAP_LENGTH;

  /**
   * A mode that specifies how the measurement component should behave. When
   * unset, the component will not respond to interactions with the handles.
   * When `edit`, the measurement anchors are interactive and the user is able
   * to reposition them. When `replace`, anytime the user clicks on the canvas,
   * a new measurement will be performed.
   */
  @Prop({ reflect: true })
  public mode: ViewerMeasurementDistanceMode = '';

  /**
   * A property that reflects which anchor is currently being interacted with.
   */
  @Prop({ reflect: true, mutable: true })
  public interactingAnchor: Anchor | 'none' = 'none';

  /**
   * Indicates if the measurement is invalid. A measurement is invalid if either
   * the start or end position are not on the surface of the model.
   */
  @Prop({ mutable: true, reflect: true })
  public invalid = false;

  /**
   * The camera used to position the anchors. If `viewer` is defined, then the
   * projection view matrix of the viewer will be used.
   */
  @Prop()
  public camera?: FramePerspectiveCamera;

  /**
   * @internal
   */
  @Prop()
  public hitProvider?: PointToPointHitProvider;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public indicatorPt?: Vector3.Vector3;

  /**
   * The viewer to connect to this measurement. The measurement will redraw any
   * time the viewer redraws the scene.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The measurement model that will be updated when this measurement changes.
   * You can pass this to a <vertex-viewer-measurement-details> component to
   * display measurement outcomes.
   */
  @Prop()
  public measurementModel: MeasurementModel = new MeasurementModel();

  /**
   * An event that is dispatched anytime the user begins editing the
   * measurement.
   */
  @Event()
  public editBegin!: EventEmitter<EditBeginEventDetails>;

  /**
   * An event that is dispatched when the user has finished editing the
   * measurement.
   */
  @Event()
  public editEnd!: EventEmitter<EditEndEventDetails>;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private elementBounds?: DOMRect;

  @State()
  private interactionCount = 0;

  @State()
  private internalCamera?: FramePerspectiveCamera;

  @State()
  private invalidateStateCounter = 0;

  @State()
  // Any data that should be preserved across live-reloads, but should not cause
  // a rerender if changed.
  private stateMap: StateMap = {};

  @State()
  private measurementUnits = new DistanceUnits(this.units);

  @Element()
  private hostEl!: HTMLElement;

  private model = PointToPointInteractionModel.empty();
  private controller = new PointToPointInteractionController(this.model);
  private interaction?: PointToPointInteraction;

  private overlays = new MeasurementOverlayManager();
  private overlay?: MeasurementOverlay;

  private isUserInteractingWithModel = false;

  /**
   * Computes the bounding boxes of the anchors and label. **Note:** invoking
   * this function uses `getBoundingClientRect` internally and will cause a
   * relayout of the DOM.
   */
  @Method()
  public async computeElementMetrics(): Promise<
    ViewerMeasurementDistanceElementMetrics | undefined
  > {
    const startAnchorEl =
      this.hostEl.shadowRoot?.getElementById('start-anchor');
    const endAnchorEl = this.hostEl.shadowRoot?.getElementById('end-anchor');
    const labelEl = this.hostEl.shadowRoot?.getElementById('label');

    if (startAnchorEl != null && endAnchorEl != null && labelEl != null) {
      return {
        startAnchor: startAnchorEl.getBoundingClientRect(),
        endAnchor: endAnchorEl.getBoundingClientRect(),
        label: labelEl.getBoundingClientRect(),
      };
    } else {
      return undefined;
    }
  }

  /**
   * @ignore
   */
  protected disconnectedCallback(): void {
    this.stateMap.hoverCursor?.dispose();
  }

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.updatePropsFromJson();
    this.model.setMeasurementFromValues(this.start, this.end, !this.invalid);

    this.getStencilBuffer();
    this.updateViewport();

    this.handleViewerChanged(this.viewer);
    this.handleModeChanged();

    this.computePropsAndState();

    this.model.onIndicatorChanged((pt) => {
      this.indicatorPt = pt;
    });
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    const resize = new ResizeObserver(() => this.updateViewport());
    resize.observe(this.hostEl);
  }

  /**
   * @ignore
   */
  protected componentWillUpdate(): void {
    this.computePropsAndState();
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        {this.showAxisReferenceLines && (
          <vertex-viewer-measurement-overlays
            measurementOverlays={this.overlays}
            viewer={this.viewer}
          />
        )}
        {this.renderMeasurement()}
      </Host>
    );
  }

  private renderMeasurement(): h.JSX.IntrinsicElements {
    const positions = this.computeElementPositions();
    const { startPt, endPt, labelPt, indicatorPt, hideStart, hideEnd } =
      positions;
    const distance = this.formatDistance(this.distance);

    if (this.mode === 'edit' || this.mode === 'replace') {
      return (
        <DistanceMeasurementRenderer
          startPt={startPt}
          endPt={endPt}
          centerPt={labelPt}
          indicatorPt={indicatorPt}
          distance={distance}
          anchorLabelOffset={this.anchorLabelOffset}
          lineCapLength={this.lineCapLength}
          hideStartAnchor={hideStart}
          hideEndAnchor={hideEnd}
          onStartAnchorPointerDown={this.handleEditAnchor('start')}
          onEndAnchorPointerDown={this.handleEditAnchor('end')}
        />
      );
    } else {
      return (
        <DistanceMeasurementRenderer
          startPt={startPt}
          endPt={endPt}
          centerPt={labelPt}
          indicatorPt={this.indicatorPt}
          distance={distance}
          hideStartAnchor={hideStart}
          hideEndAnchor={hideEnd}
          anchorLabelOffset={this.anchorLabelOffset}
          lineCapLength={this.lineCapLength}
          linePointerEvents="painted"
        />
      );
    }
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
      oldViewer.removeEventListener('frameDrawn', this.handleFrameDrawn);
      this.removeInteractionListeners(oldViewer);
    }

    if (newViewer != null) {
      newViewer.addEventListener('frameDrawn', this.handleFrameDrawn);
      this.addInteractionListeners(newViewer);
    }
  }

  /**
   * @ignore
   */
  @Watch('units')
  protected handleUnitsChanged(): void {
    this.measurementUnits = new DistanceUnits(this.units);
  }

  /**
   * @ignore
   */
  @Watch('camera')
  protected handleCameraChanged(): void {
    this.updateCamera();
  }

  /**
   * @ignore
   */
  @Watch('mode')
  protected handleModeChanged(): void {
    this.warnIfDepthBuffersDisabled();

    if (this.viewer != null) {
      this.removeInteractionListeners(this.viewer);
      this.addInteractionListeners(this.viewer);
    }
  }

  /**
   * @ignore
   */
  @Watch('start')
  protected handleStartChanged(): void {
    this.updateInteractionModel();
  }

  /**
   * @ignore
   */
  @Watch('end')
  protected handleEndChanged(): void {
    this.updateInteractionModel();
  }

  /**
   * @ignore
   */
  @Watch('invalid')
  protected handleInvalidChanged(): void {
    this.updateInteractionModel();
  }

  private computePropsAndState(): void {
    this.updateCamera();
    this.updateDepthBuffer();
    this.updateMeasurementPropsFromModel();
    this.updateOverlays();
  }

  private updateOverlays(): void {
    this.overlay?.dispose();

    if (
      this.showAxisReferenceLines &&
      this.interactionCount === 0 &&
      !this.invalid &&
      this.start != null &&
      this.end != null
    ) {
      this.overlay = this.overlays.addDistanceVector(this.start, this.end);
    }
  }

  private async setCursor(cursor: Cursor): Promise<void> {
    this.stateMap.hoverCursor?.dispose();

    if (!this.isUserInteractingWithModel) {
      this.stateMap.hoverCursor = await this.viewer?.addCursor(cursor);
    }
  }

  private computeElementPositions(): MeasurementElementPositions {
    if (this.mode === 'replace') {
      return this.computeReplaceElementPositions();
    } else {
      return this.computeEditOrViewElementPositions();
    }
  }

  private computeEditOrViewElementPositions(): MeasurementElementPositions {
    const measurement = this.model.getMeasurement();
    if (this.internalCamera != null && measurement != null) {
      return this.computeLineElementPositions(Line3.create(measurement));
    } else {
      return {};
    }
  }

  private computeReplaceElementPositions(): MeasurementElementPositions {
    if (this.internalCamera != null) {
      const measurement = this.model.getMeasurement();

      const line =
        measurement != null
          ? this.computeLineElementPositions(Line3.create(measurement))
          : {};
      const indicator =
        this.indicatorPt != null
          ? {
              indicatorPt: this.viewport.transformWorldToViewport(
                this.indicatorPt,
                this.internalCamera.projectionViewMatrix
              ),
            }
          : {};

      return { ...line, ...indicator };
    } else {
      return {};
    }
  }

  private computeLineElementPositions(
    line: Line3.Line3
  ): MeasurementElementPositions {
    if (this.internalCamera != null) {
      return getViewingElementPositions(line, this.interactingAnchor, {
        viewport: this.viewport,
        camera: this.internalCamera,
      });
    } else {
      return {};
    }
  }

  private updateCamera(): void {
    this.internalCamera = this.camera || this.viewer?.frame?.scene.camera;
  }

  private async updateDepthBuffer(): Promise<void> {
    this.stateMap.depthBuffer = await this.viewer?.frame?.depthBuffer();
  }

  private updateViewport(): void {
    const rect = getMeasurementBoundingClientRect(this.hostEl);
    this.viewport = new Viewport(rect.width, rect.height);
    this.elementBounds = rect;
  }

  private updatePropsFromJson(): void {
    this.start = parseVector3(this.startJson ?? this.start);
    this.end = parseVector3(this.endJson ?? this.end);
  }

  private updateInteractionModel(): void {
    this.model.setMeasurementFromValues(this.start, this.end, !this.invalid);
  }

  private handleFrameDrawn = (): void => {
    this.invalidateState();
  };

  private invalidateState(): void {
    this.invalidateStateCounter = this.invalidateStateCounter + 1;
  }

  private async addInteractionListeners(
    viewer: HTMLVertexViewerElement
  ): Promise<void> {
    const interactionTarget = await viewer.getInteractionTarget();
    if (this.mode === 'replace') {
      interactionTarget.addEventListener('pointermove', this.updateStartAnchor);
      interactionTarget.addEventListener('pointerdown', this.newMeasurement);
      interactionTarget.addEventListener('pointerleave', this.clearIndicator);
    }
  }

  private async removeInteractionListeners(
    viewer: HTMLVertexViewerElement
  ): Promise<void> {
    const interactionTarget = await viewer.getInteractionTarget();
    interactionTarget.removeEventListener(
      'pointermove',
      this.updateStartAnchor
    );
    interactionTarget.removeEventListener('pointerdown', this.newMeasurement);
    interactionTarget.removeEventListener('pointerleave', this.clearIndicator);
  }

  private clearIndicator = (): void => {
    this.controller.clearIndicator();
  };

  private updateStartAnchor = async (event: PointerEvent): Promise<void> => {
    this.getStencilBuffer();

    if (this.interactionCount === 0) {
      const pt = getMouseClientPosition(event, this.elementBounds);
      const snapPt = this.snapPoint(pt, event);
      this.updateIndicator(snapPt);
    }
  };

  private newMeasurement = (event: PointerEvent): void => {
    if (this.interactionCount === 0 && event.button === 0) {
      // Function that registers event listeners to perform a new measurement.
      const startMeasurement = (start: () => void): void => {
        const dispose = (): void => {
          window.removeEventListener('pointerup', pointerUp);
          window.removeEventListener('pointermove', pointerMove);
        };
        const pointerUp = async (): Promise<void> => {
          dispose();
          start();
        };
        const pointerMove = (event: PointerEvent): void => {
          if (event.buttons > 0) {
            dispose();
          }
        };

        window.addEventListener('pointermove', pointerMove);
        window.addEventListener('pointerup', pointerUp);
      };

      // Function that registers event listeners to detect if a user is
      // interacting with the model. If so, we temporarily disable measurement
      // updates until the user finishes.
      const pointerDownAndMove = (callback: () => void): Disposable => {
        let downPt: Point.Point = Point.create(0, 0);

        const pointerMove = (event: PointerEvent): void => {
          const dist = Point.distance(downPt, getMouseClientPosition(event));
          if (dist >= INTERACTION_THRESHOLD) {
            callback();
          }
        };

        const dispose = (): void => {
          window.removeEventListener('pointermove', pointerMove);
          window.removeEventListener('pointerup', pointerUp);
        };

        const pointerUp = (): void => dispose();

        const pointerDown = (event: PointerEvent): void => {
          downPt = getMouseClientPosition(event);
          window.addEventListener('pointermove', pointerMove);
          window.addEventListener('pointerup', pointerUp);
        };

        window.addEventListener('pointerdown', pointerDown);

        return {
          dispose: () => window.removeEventListener('pointerdown', pointerDown),
        };
      };

      // Function that registers event listeners to finish a measurement.
      const measureInteraction = (): void => {
        const handleDownAndMove = pointerDownAndMove(() => {
          this.isUserInteractingWithModel = true;
          this.stateMap.hoverCursor?.dispose();
        });

        const dispose = (): void => {
          window.removeEventListener('pointermove', pointerMove);
          window.removeEventListener('pointerup', pointerUp);
          handleDownAndMove.dispose();
        };

        const pointerMove = this.createInteractionMoveHandler();
        const pointerUp = async (event: PointerEvent): Promise<void> => {
          if (event.button === 0) {
            if (this.isUserInteractingWithModel) {
              this.isUserInteractingWithModel = false;
            } else {
              const hits = this.getHitProvider();
              if (hits != null) {
                const pt = getMouseClientPosition(event, this.elementBounds);
                const snapPt = this.snapPoint(pt, event);
                await this.interaction?.finish(snapPt, hits);

                dispose();
                this.updateMeasurementPropsFromModel();
                this.endEditing();
              }
            }
          }
        };

        this.beginEditing('replace', 'end');
        window.addEventListener('pointermove', pointerMove);
        window.addEventListener('pointerup', pointerUp);
      };

      const hits = this.getHitProvider();
      if (hits != null) {
        const pt = getMouseClientPosition(event, this.elementBounds);
        const snapPt = this.snapPoint(pt, event);
        this.interaction = this.controller.newMeasurement(snapPt, hits);

        if (this.interaction != null) {
          startMeasurement(measureInteraction);
        }
      }
    }
  };

  private handleEditAnchor(
    anchor: Anchor
  ): ((event: PointerEvent) => void) | undefined {
    if (this.mode === 'edit' || this.mode === 'replace') {
      const handlePointerMove = this.createInteractionMoveHandler();
      const handlePointerUp = async (event: PointerEvent): Promise<void> => {
        const hits = this.getHitProvider();
        if (hits != null) {
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);

          const pt = getMouseClientPosition(event, this.elementBounds);
          const snapPt = this.snapPoint(pt, event);
          await this.interaction?.finish(snapPt, hits);

          this.updateMeasurementPropsFromModel();
          this.endEditing();
        }
      };

      return (event) => {
        this.getStencilBuffer();

        if (event.button === 0) {
          this.beginEditing('edit', anchor);

          this.interaction = this.controller.editMeasurement(anchor);

          window.addEventListener('pointermove', handlePointerMove);
          window.addEventListener('pointerup', handlePointerUp);
        }
      };
    }
  }

  private createInteractionMoveHandler(): (event: PointerEvent) => void {
    return (event) => {
      const hits = this.getHitProvider();
      if (this.elementBounds != null && hits != null) {
        event.preventDefault();
        this.getStencilBuffer();

        const pt = getMouseClientPosition(event, this.elementBounds);
        const snapPt = this.snapPoint(pt, event);
        this.interaction?.update(snapPt, hits);
        this.updateMeasurementPropsFromModel();
      }
    };
  }

  private async getStencilBuffer(): Promise<void> {
    const stencil = await this.viewer?.stencilBuffer.latestAfterInteraction();
    this.stateMap.stencil = stencil;
  }

  private snapPoint(pt: Point.Point, event: MouseEvent): Point.Point {
    const hits = this.getHitProvider();
    if (hits != null && !event.shiftKey) {
      const snapDistance = Math.max(0, this.snapDistance);
      return hits.hitTester().snapToNearestPixel(pt, snapDistance);
    }
    return pt;
  }

  private formatDistance(distance: number | undefined): string {
    const dist =
      distance != null
        ? this.measurementUnits.convertWorldValueToReal(distance)
        : undefined;

    if (this.labelFormatter != null) {
      return this.labelFormatter(dist);
    } else {
      const abbreviated = this.measurementUnits.unit.abbreviatedName;
      return dist == null
        ? '---'
        : `~${dist.toFixed(this.fractionalDigits)} ${abbreviated}`;
    }
  }

  private beginEditing(
    type: EditBeginEventDetails['type'],
    anchor: EditBeginEventDetails['anchor']
  ): void {
    if (this.interactionCount === 0) {
      this.interactingAnchor = anchor;
      this.editBegin.emit({ type, anchor });
    }
    this.interactionCount = this.interactionCount + 1;
  }

  private endEditing(): void {
    if (this.interactionCount === 1) {
      const measurement = this.model.getMeasurement();

      this.interactingAnchor = 'none';
      this.updateMeasurementModel();

      if (measurement != null) {
        this.editEnd.emit(measurement);
      }
    }
    this.interactionCount = this.interactionCount - 1;
  }

  private updateMeasurementModel(): void {
    this.measurementModel.clearOutcome();

    if (!this.invalid && this.start != null && this.end != null) {
      this.measurementModel.setOutcome({
        isApproximate: true,
        results: [makeMinimumDistanceResult(this.start, this.end)],
      });
    }
  }

  private getHitProvider(): PointToPointHitProvider | undefined {
    if (this.hitProvider == null) {
      const hitTester = this.getHitTester();
      const viewer = this.viewer;
      if (viewer != null && hitTester != null) {
        return {
          hitTester: () => hitTester,
          raycaster: async () => (await viewer.scene()).raycaster(),
        };
      }
    } else return this.hitProvider;
  }

  private getHitTester(): PointToPointHitTester | undefined {
    const { stencil, depthBuffer } = this.stateMap;
    if (depthBuffer != null) {
      return new PointToPointHitTester(stencil, depthBuffer, this.viewport);
    }
  }

  private updateMeasurementPropsFromModel(): void {
    const measurement = this.model.getMeasurement();
    this.start = measurement?.start;
    this.end = measurement?.end;
    this.distance = measurement?.distance;
    this.invalid = measurement != null && !measurement.valid;
  }

  private updateIndicator(pt: Point.Point): void {
    const hits = this.getHitProvider();
    const clearCursor =
      hits == null || !this.controller.moveIndicator(pt, hits);
    if (clearCursor) {
      this.stateMap.hoverCursor?.dispose();
    } else {
      this.setCursor(measurementCursor);
    }
  }

  private warnIfDepthBuffersDisabled(): void {
    if (this.viewer != null && this.viewer.depthBuffers == null) {
      console.warn(
        'Measurement editing is disabled. <vertex-viewer> must have its `depth-buffers` attribute set.'
      );
    }
  }
}

function parseVector3(
  value: string | Vector3.Vector3 | undefined
): Vector3.Vector3 | undefined {
  return typeof value === 'string' ? Vector3.fromJson(value) : value;
}
