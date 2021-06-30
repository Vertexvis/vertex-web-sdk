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
import classNames from 'classnames';
import { Line3, Matrix4, Vector3 } from '@vertexvis/geometry';
import {
  DepthBuffer,
  MeasurementUnits,
  UnitType,
  Viewport,
} from '../../lib/types';
import { ElementPositions, getViewingElementPositions } from './utils';
import { getMeasurementBoundingClientRect } from './dom';
import { getMouseClientPosition } from '../../lib/dom';
import { DistanceMeasurement } from './viewer-distance-measurement-components';
import { Disposable } from '@vertexvis/utils';

/**
 * Contains the bounding boxes of child elements of this component. This
 * information is useful for positioning popups or other elements around the
 * measurement.
 *
 * @see {@link ViewerDistanceMeasurement.computeElementMetrics} - For
 * calculating element metrics.
 */
export interface ViewerDistanceMeasurementElementMetrics {
  startAnchor: DOMRect;
  endAnchor: DOMRect;
  label: DOMRect;
}

/**
 * A type that represents a function that takes a real-world distance and
 * returns a formatted string.
 */
export type ViewerDistanceMeasurementLabelFormatter = (
  distance: number | undefined
) => string;

/**
 * The supported measurement modes.
 *
 * @see {@link ViewerDistanceMeasurement.mode} - For more details about modes.
 */
export type ViewerDistanceMeasurementMode = 'edit' | 'replace' | '';

type Anchor = 'start' | 'end';

/**
 * @slot start-anchor An HTML element for the starting point anchor.
 *
 * @slot end-anchor An HTML element for the ending point anchor.
 */
@Component({
  tag: 'vertex-viewer-distance-measurement',
  styleUrl: 'viewer-distance-measurement.css',
  shadow: true,
})
export class ViewerDistanceMeasurement {
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
  public labelFormatter?: ViewerDistanceMeasurementLabelFormatter;

  /**
   * A mode that specifies how the measurement component should behave. When
   * unset, the component will not respond to interactions with the handles.
   * When `edit`, the measurement anchors are interactive and the user is able
   * to reposition them. When `replace`, anytime the user clicks on the canvas,
   * a new measurement will be performed.
   */
  @Prop({ reflect: true })
  public mode: ViewerDistanceMeasurementMode = '';

  /**
   * Indicates if the measurement is invalid. A measurement is invalid if either
   * the start or end position are not on the surface of the model.
   */
  @Prop({ mutable: true, reflect: true })
  public invalid = false;

  /**
   * The projection view matrix used to position the anchors. If `viewer` is
   * defined, then the projection view matrix of the viewer will be used.
   */
  @Prop()
  public projectionViewMatrix?: Matrix4.Matrix4;

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
  private internalProjectionViewMatrix?: Matrix4.Matrix4;

  @State()
  private internalDepthBuffer?: DepthBuffer;

  @State()
  private measurementUnits = new MeasurementUnits(this.units);

  @State()
  private invalidateStateCounter = 0;

  @Element()
  private hostEl!: HTMLElement;

  public static isType(
    el: unknown
  ): el is HTMLVertexViewerDistanceMeasurementElement {
    return (
      el instanceof HTMLElement &&
      el.nodeName === 'VERTEX-VIEWER-DISTANCE-MEASUREMENT'
    );
  }

  /**
   * Computes the bounding boxes of the anchors and label. **Note:** invoking
   * this function uses `getBoundingClientRect` internally and will cause a
   * relayout of the DOM.
   */
  @Method()
  public async computeElementMetrics(): Promise<
    ViewerDistanceMeasurementElementMetrics | undefined
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

  protected componentWillUpdate(): void {
    this.computePropsAndState();
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    const positions = this.computeElementPositions();
    const { startPt, endPt, labelPt } = positions;
    const distance = this.formatDistance(this.distance);

    if (this.mode === 'edit') {
      return (
        <Host>
          <div class="measurement">
            <DistanceMeasurement
              startPt={startPt}
              endPt={endPt}
              labelPt={labelPt}
              distance={distance}
              onStartAnchorPointerDown={this.handleEditAnchor('start')}
              onEndAnchorPointerDown={this.handleEditAnchor('end')}
            />
          </div>
        </Host>
      );
    } else if (this.mode === 'replace') {
      return (
        <Host>
          <div
            class={classNames('measurement replace', {
              'cursor-crosshair': this.start != null,
            })}
            onPointerMove={this.handleUpdateStartAnchor}
            onPointerDown={this.handleStartMeasurement}
          >
            <DistanceMeasurement
              startPt={startPt}
              endPt={endPt}
              labelPt={labelPt}
              distance={distance}
            />
          </div>
        </Host>
      );
    } else {
      return (
        <Host>
          <div class="measurement">
            <DistanceMeasurement
              startPt={startPt}
              endPt={endPt}
              labelPt={labelPt}
              distance={distance}
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
    oldViewer?.removeEventListener('frameDrawn', this.handleFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleFrameDrawn);
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
  @Watch('projectionViewMatrix')
  protected handleProjectionViewMatrixChanged(): void {
    this.updateProjectionViewMatrix();
  }

  /**
   * @ignore
   */
  @Watch('mode')
  protected handleModeChanged(): void {
    this.warnIfDepthBuffersDisabled();
  }

  private computePropsAndState(): void {
    this.updateProjectionViewMatrix();
    this.updateDepthBuffer();
    this.updateLineFromProps();
    this.updateInvalid();
    this.updateDistance();
  }

  private computeElementPositions(): ElementPositions {
    if (this.internalProjectionViewMatrix != null && this.line != null) {
      return getViewingElementPositions(this.line, {
        projectionViewMatrix: this.internalProjectionViewMatrix,
        viewport: this.viewport,
      });
    } else {
      return {};
    }
  }

  private updateProjectionViewMatrix(): void {
    this.internalProjectionViewMatrix =
      this.projectionViewMatrix ||
      this.viewer?.frame?.scene.camera.projectionViewMatrix;
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
      if (this.line != null && this.internalProjectionViewMatrix != null) {
        const lineNdc = Line3.transformMatrix(
          this.line,
          this.internalProjectionViewMatrix
        );
        const startPt = this.viewport.transformPointToFrame(
          this.viewport.transformPointToViewport(lineNdc.start),
          this.internalDepthBuffer
        );
        const endPt = this.viewport.transformPointToFrame(
          this.viewport.transformPointToViewport(lineNdc.end),
          this.internalDepthBuffer
        );

        this.invalid =
          !this.internalDepthBuffer.isDepthAtFarPlane(startPt) ||
          !this.internalDepthBuffer.isDepthAtFarPlane(endPt);
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

  private handleUpdateStartAnchor = (event: PointerEvent): void => {
    if (
      this.interactionCount === 0 &&
      this.internalDepthBuffer != null &&
      this.elementBounds != null
    ) {
      const pt = getMouseClientPosition(event, this.elementBounds);
      const framePt = this.viewport.transformPointToFrame(
        pt,
        this.internalDepthBuffer
      );
      const hasDepth = this.internalDepthBuffer.isDepthAtFarPlane(framePt);
      const worldPt = this.viewport.transformPointToWorldSpace(
        pt,
        this.internalDepthBuffer
      );
      this.start = hasDepth ? worldPt : undefined;
    }
  };

  private handleStartMeasurement = (event: PointerEvent): void => {
    if (this.interactionCount === 0 && this.start != null) {
      const startMeasurement = (start: () => void): void => {
        const dispose = (): void => {
          window.removeEventListener('pointerup', pointerUp);
          window.removeEventListener('pointermove', pointerMove);
        };
        const pointerUp = (): void => {
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
        let didUserInteractWithModel = false;

        const handleDownAndMove = pointerDownAndMove(() => {
          didUserInteractWithModel = true;
        });

        const dispose = (): void => {
          window.removeEventListener('pointermove', pointerMove);
          window.removeEventListener('pointerup', pointerUp);
          handleDownAndMove.dispose();
        };

        const pointerMove = this.createAnchorPointerMoveHandler('end');
        const pointerUp = (event: PointerEvent): void => {
          if (event.button === 0) {
            if (didUserInteractWithModel) {
              didUserInteractWithModel = false;
            } else {
              dispose();
              this.endEditing();
            }
          }
        };

        this.beginEditing();
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
        // Prevent the viewer from handling this event.
        event.stopPropagation();

        this.beginEditing();

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
      };
    }
  }

  private createAnchorPointerMoveHandler(
    anchor: Anchor
  ): (event: PointerEvent) => void {
    return (event) => {
      if (this.internalDepthBuffer != null && this.elementBounds != null) {
        const pt = getMouseClientPosition(event, this.elementBounds);
        const worldPt = this.viewport.transformPointToWorldSpace(
          pt,
          this.internalDepthBuffer
        );

        if (anchor === 'start') {
          this.start = worldPt;
        } else {
          this.end = worldPt;
        }
        this.updateInvalid();
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

  private formatDistance(distance: number | undefined): string {
    if (this.labelFormatter != null) {
      return this.labelFormatter(distance);
    } else {
      const abbreviated = this.measurementUnits.unit.abbreviatedName;
      return distance == null
        ? '--'
        : `~${distance.toFixed(this.fractionalDigits)} ${abbreviated}`;
    }
  }

  private beginEditing(): void {
    if (this.interactionCount === 0) {
      this.editBegin.emit();
    }
    this.interactionCount = this.interactionCount + 1;
  }

  private endEditing(): void {
    if (this.interactionCount === 1) {
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
