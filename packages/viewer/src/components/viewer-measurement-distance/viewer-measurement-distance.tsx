import {
  Component,
  Host,
  h,
  Prop,
  State,
  Watch,
  Element,
  Method,
  Event,
  EventEmitter,
} from '@stencil/core';
import { Line3, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import {
  DepthBuffer,
  FramePerspectiveCamera,
  MeasurementUnits,
  StencilBuffer,
  UnitType,
  Viewport,
} from '../../lib/types';
import {
  Anchor,
  MeasurementElementPositions,
  getViewingElementPositions,
  translatePointToWorld,
  translateWorldPtToViewport,
} from './utils';
import { getMeasurementBoundingClientRect } from './dom';
import { getMouseClientPosition } from '../../lib/dom';
import { DistanceMeasurementRenderer } from './viewer-measurement-distance-components';
import { Disposable } from '@vertexvis/utils';
import {
  MEASUREMENT_LINE_CAP_LENGTH,
  MEASUREMENT_SNAP_DISTANCE,
} from '../../lib/constants';
import { Cursor, measurementCursor } from '../../lib/cursors';

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
 * A type that represents a function that takes a real-world distance and
 * returns a formatted string.
 */
export type ViewerMeasurementDistanceLabelFormatter = (
  distance: number | undefined
) => string;

/**
 * The supported measurement modes.
 *
 * @see {@link ViewerDistanceMeasurement.mode} - For more details about modes.
 */
export type ViewerMeasurementDistanceMode = 'edit' | 'replace' | '';

interface StateMap {
  hoverCursor?: Disposable;
  stencil?: StencilBuffer;
}

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
  @Prop({ mutable: true, attribute: null })
  public start?: Vector3.Vector3;

  /**
   * The position of the starting anchor, as a JSON string. Can either be an
   * instance of a `Vector3` or a JSON string representation in the format of
   * `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.
   */
  @Prop({ attribute: 'start' })
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
  @Prop({ attribute: 'end' })
  public endJson?: string;

  /**
   * The distance between `start` and `end` in real world units. Value will be
   * undefined if the start and end positions are undefined, or if the
   * measurement is invalid.
   */
  @Prop({ mutable: true })
  public distance?: number;

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
  public units: UnitType = 'millimeters';

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
  public labelFormatter?: ViewerMeasurementDistanceLabelFormatter;

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
   * The depth buffer that is used to optimistically determine the a depth value
   * from a 2D screen point. If `viewer` is defined, then the depth buffer will
   * be automatically set.
   */
  @Prop()
  public depthBuffer?: DepthBuffer;

  /**
   * The viewer to connect to this measurement. The measurement will redraw any
   * time the viewer redraws the scene.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * An event that is dispatched anytime the user begins editing the
   * measurement.
   */
  @Event()
  public editBegin!: EventEmitter<void>;

  /**
   * An event that is dispatched when the user has finished editing the
   * measurement.
   */
  @Event()
  public editEnd!: EventEmitter<void>;

  @State()
  private line?: Line3.Line3;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private elementBounds?: DOMRect;

  @State()
  private interactionCount = 0;

  @State()
  private internalCamera?: FramePerspectiveCamera;

  @State()
  private internalDepthBuffer?: DepthBuffer;

  @State()
  private invalidateStateCounter = 0;

  @State()
  private interactiveStartPoint?: Point.Point;

  @State()
  private interactiveEndPoint?: Point.Point;

  @State()
  // Any data that should be preserved across live-reloads, but should not cause
  // a rerender if changed.
  private stateMap: StateMap = {};

  @Element()
  private hostEl!: HTMLElement;

  private measurementUnits = new MeasurementUnits(this.units);
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
    const startAnchorEl = this.hostEl.shadowRoot?.getElementById(
      'start-anchor'
    );
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
  protected componentWillLoad(): void {
    this.updateViewport();

    this.handleViewerChanged(this.viewer);
    this.handleModeChanged();

    this.computePropsAndState();
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
    const positions = this.computeElementPositions();
    const {
      startPt,
      endPt,
      labelPt,
      indicatorPt,
      hideStart,
      hideEnd,
    } = positions;
    const distance = this.formatDistance(this.distance);

    if (this.mode === 'edit') {
      return (
        <Host>
          <div class="measurement">
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
          </div>
        </Host>
      );
    } else if (this.mode === 'replace') {
      return (
        <Host>
          <div class="measurement">
            <DistanceMeasurementRenderer
              startPt={startPt}
              endPt={endPt}
              centerPt={labelPt}
              indicatorPt={indicatorPt}
              distance={distance}
              hideStartAnchor={hideStart}
              hideEndAnchor={hideEnd}
              anchorLabelOffset={this.anchorLabelOffset}
              lineCapLength={this.lineCapLength}
            />
          </div>
        </Host>
      );
    } else {
      return (
        <Host>
          <div class="measurement">
            <DistanceMeasurementRenderer
              startPt={startPt}
              endPt={endPt}
              centerPt={labelPt}
              indicatorPt={indicatorPt}
              distance={distance}
              hideStartAnchor={hideStart}
              hideEndAnchor={hideEnd}
              anchorLabelOffset={this.anchorLabelOffset}
              lineCapLength={this.lineCapLength}
              linePointerEvents="painted"
            />
          </div>
        </Host>
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
    this.measurementUnits = new MeasurementUnits(this.units);
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
  }

  private computePropsAndState(): void {
    this.updateCamera();
    this.updateDepthBuffer();
    this.updateLineFromProps();
    this.updateDistance();
    this.updateInteraction();
  }

  private updateInteraction(): void {
    if (this.mode === 'replace') {
      this.updateReplaceInteraction();
    } else if (this.mode === 'edit') {
      this.updateEditInteraction();
    }

    if (this.interactionCount > 0) {
      this.updateLineFromProps();
      this.updateInvalid();
    }
  }

  private updateReplaceInteraction(): void {
    this.stateMap.hoverCursor?.dispose();

    if (this.interactiveStartPoint != null) {
      this.start = translatePointToWorld(
        this.interactiveStartPoint,
        this.internalDepthBuffer,
        this.viewport
      );
    }

    // Don't update the end point if the depth buffer is undefined. This is
    // to not clear the measurement line if the user interacts with the model
    // while performing a measurement.
    if (this.interactiveEndPoint != null && this.internalDepthBuffer != null) {
      this.end = translatePointToWorld(
        this.interactiveEndPoint,
        this.internalDepthBuffer,
        this.viewport,
        { ignoreDepthTest: true }
      );
    }

    this.interactiveStartPoint = undefined;
    this.interactiveEndPoint = undefined;

    if (this.start != null) {
      this.setCursor(measurementCursor);
    }
  }

  private updateEditInteraction(): void {
    this.stateMap.hoverCursor?.dispose();

    if (this.interactionCount > 0) {
      if (this.interactiveStartPoint != null) {
        this.start = translatePointToWorld(
          this.interactiveStartPoint,
          this.internalDepthBuffer,
          this.viewport,
          { ignoreDepthTest: true }
        );
      }

      if (this.interactiveEndPoint != null) {
        this.end = translatePointToWorld(
          this.interactiveEndPoint,
          this.internalDepthBuffer,
          this.viewport,
          { ignoreDepthTest: true }
        );
      }

      this.interactiveStartPoint = undefined;
      this.interactiveEndPoint = undefined;
      this.setCursor(measurementCursor);
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
    if (this.internalCamera != null && this.line != null) {
      return this.computeLineElementPositions(
        this.internalCamera.projectionViewMatrix,
        this.line
      );
    } else {
      return {};
    }
  }

  private computeReplaceElementPositions(): MeasurementElementPositions {
    if (this.internalCamera != null) {
      if (this.line != null) {
        return this.computeLineElementPositions(
          this.internalCamera.projectionViewMatrix,
          this.line
        );
      } else if (this.start != null) {
        return {
          indicatorPt: translateWorldPtToViewport(
            this.start,
            this.internalCamera.projectionViewMatrix,
            this.viewport
          ),
        };
      }
    }
    return {};
  }

  private computeLineElementPositions(
    matrix: Matrix4.Matrix4,
    line: Line3.Line3
  ): MeasurementElementPositions {
    if (this.internalCamera != null) {
      return getViewingElementPositions(line, this.interactingAnchor, {
        projectionViewMatrix: matrix,
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
    this.internalDepthBuffer =
      this.depthBuffer || (await this.viewer?.frame?.depthBuffer());
  }

  private updateLineFromProps(): void {
    const start = this.start || parseVector3(this.startJson);
    const end = this.end || parseVector3(this.endJson);
    this.line =
      start != null && end != null ? Line3.create({ start, end }) : undefined;
  }

  private updateViewport(): void {
    const rect = getMeasurementBoundingClientRect(this.hostEl);
    this.viewport = new Viewport(rect.width, rect.height);
    this.elementBounds = rect;
  }

  private updateInvalid(): void {
    if (this.internalDepthBuffer != null) {
      if (this.line != null && this.internalCamera != null) {
        const lineNdc = Line3.transformMatrix(
          this.line,
          this.internalCamera.projectionViewMatrix
        );
        const startPt = this.viewport.transformPointToFrame(
          this.viewport.transformVectorToViewport(lineNdc.start),
          this.internalDepthBuffer
        );
        const endPt = this.viewport.transformPointToFrame(
          this.viewport.transformVectorToViewport(lineNdc.end),
          this.internalDepthBuffer
        );

        const isStartInvalid =
          this.interactingAnchor === 'start' &&
          !this.internalDepthBuffer.isDepthAtFarPlane(startPt);
        const isEndInvalid =
          this.interactingAnchor === 'end' &&
          !this.internalDepthBuffer.isDepthAtFarPlane(endPt);

        this.invalid = isStartInvalid || isEndInvalid;
      }
    }
  }

  private updateDistance(): void {
    const worldDistance =
      this.line != null && !this.invalid
        ? Line3.distance(this.line)
        : undefined;
    this.distance =
      worldDistance != null
        ? this.measurementUnits.translateWorldValueToReal(worldDistance)
        : undefined;
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
      interactionTarget.addEventListener('pointerdown', this.startMeasurement);
      interactionTarget.addEventListener('pointerleave', this.resetStartAnchor);
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
    interactionTarget.removeEventListener('pointerdown', this.startMeasurement);
    interactionTarget.removeEventListener(
      'pointerleave',
      this.resetStartAnchor
    );
  }

  private updateStartAnchor = async (event: PointerEvent): Promise<void> => {
    if (this.interactionCount === 0) {
      const pt = getMouseClientPosition(event, this.elementBounds);
      const snapPt = this.snapPoint(pt, event);
      this.getStencilBuffer();
      this.interactiveStartPoint = snapPt;
    }
  };

  private resetStartAnchor = (): void => {
    if (this.interactionCount === 0) {
      this.start = undefined;
      this.interactiveStartPoint = undefined;
    }
  };

  private startMeasurement = (event: PointerEvent): void => {
    if (
      this.interactionCount === 0 &&
      this.start != null &&
      event.button === 0
    ) {
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

      const pointerDownAndMove = (callback: () => void): Disposable => {
        const pointerMove = (): void => callback();

        const dispose = (): void => {
          window.removeEventListener('pointermove', pointerMove);
          window.removeEventListener('pointerup', pointerUp);
        };

        const pointerUp = (): void => dispose();

        const pointerDown = (): void => {
          window.addEventListener('pointermove', pointerMove);
          window.addEventListener('pointerup', pointerUp);
        };

        window.addEventListener('pointerdown', pointerDown);

        return {
          dispose: () => window.removeEventListener('pointerdown', pointerDown),
        };
      };

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

        const pointerMove = this.createAnchorPointerMoveHandler('end');
        const pointerUp = (event: PointerEvent): void => {
          if (event.button === 0) {
            if (this.isUserInteractingWithModel) {
              this.isUserInteractingWithModel = false;
            } else {
              dispose();
              this.endEditing();
            }
          }
        };

        this.beginEditing('end');
        window.addEventListener('pointermove', pointerMove);
        window.addEventListener('pointerup', pointerUp);
      };
      startMeasurement(measureInteraction);
    }
  };

  private handleEditAnchor(
    anchor: Anchor
  ): ((event: PointerEvent) => void) | undefined {
    if (this.mode === 'edit' && this.internalDepthBuffer != null) {
      const handlePointerMove = this.createAnchorPointerMoveHandler(anchor);
      const handlePointerUp = this.createAnchorPointerUpHandler(
        anchor,
        handlePointerMove
      );

      return (event) => {
        if (event.button === 0) {
          this.beginEditing(anchor);
          this.getStencilBuffer();

          window.addEventListener('pointermove', handlePointerMove);
          window.addEventListener('pointerup', handlePointerUp);
        }
      };
    }
  }

  private createAnchorPointerMoveHandler(
    anchor: Anchor
  ): (event: PointerEvent) => void {
    return (event) => {
      if (this.elementBounds != null) {
        event.preventDefault();
        this.getStencilBuffer();

        const pt = getMouseClientPosition(event, this.elementBounds);
        const snapPt = this.snapPoint(pt, event);

        if (anchor === 'start') {
          this.interactiveStartPoint = snapPt;
        } else {
          this.interactiveEndPoint = snapPt;
        }
      }
    };
  }

  private createAnchorPointerUpHandler(
    anchor: 'start' | 'end',
    pointerMove: (event: PointerEvent) => void
  ): (event: PointerEvent) => void {
    const handlePointerUp = (): void => {
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      this.endEditing();
    };

    return handlePointerUp;
  }

  private async getStencilBuffer(): Promise<void> {
    const stencil = await this.viewer?.stencilBuffer.latestAfterInteraction();
    this.stateMap.stencil = stencil;
  }

  private snapPoint(pt: Point.Point, event: MouseEvent): Point.Point {
    const { stencil } = this.stateMap;
    if (stencil != null && !event.shiftKey) {
      const framePt = this.viewport.transformPointToFrame(pt, stencil);
      const snapDistance = Math.max(0, this.snapDistance);
      const nearestPt = stencil.getNearestPixel(framePt, snapDistance);

      if (nearestPt != null) {
        return this.viewport.transformPointToViewport(nearestPt, stencil);
      }
    }
    return pt;
  }

  private formatDistance(distance: number | undefined): string {
    if (this.labelFormatter != null) {
      return this.labelFormatter(distance);
    } else {
      const abbreviated = this.measurementUnits.unit.abbreviatedName;
      return distance == null
        ? '---'
        : `~${distance.toFixed(this.fractionalDigits)} ${abbreviated}`;
    }
  }

  private beginEditing(anchor: Anchor): void {
    if (this.interactionCount === 0) {
      this.interactingAnchor = anchor;
      this.editBegin.emit();
    }
    this.interactionCount = this.interactionCount + 1;
  }

  private endEditing(): void {
    if (this.interactionCount === 1) {
      this.interactingAnchor = 'none';
      this.editEnd.emit();
    }
    this.interactionCount = this.interactionCount - 1;
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