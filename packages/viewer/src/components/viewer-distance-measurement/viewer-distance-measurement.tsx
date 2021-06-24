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
  MeasurementUnits,
  UnitType,
  Viewport,
} from '../../lib/types';
import { ElementPositions, getViewingElementPositions } from './utils';
import { getMeasurementBoundingClientRect } from './dom';

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
  @Prop({ mutable: true })
  public start?: Vector3.Vector3 | string;

  /**
   * The position of the ending anchor. Can either be an instance of a `Vector3`
   * or a JSON string representation in the format of `[x, y, z]` or `{"x": 0,
   * "y": 0, "z": 0}`.
   */
  @Prop({ mutable: true })
  public end?: Vector3.Vector3 | string;

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

  @Prop()
  public editable = false;

  @Prop({ mutable: true, reflect: true })
  public invalid = false;

  /**
   * The projection view matrix used to position the anchors. If `viewer` is
   * defined, then the projection view matrix of the viewer will be used.
   */
  @Prop()
  public projectionViewMatrix?: Matrix4.Matrix4;

  @Prop()
  public depthBuffer?: DepthBuffer;

  /**
   * The viewer to connect to this measurement. The measurement will redraw any
   * time the viewer redraws the scene.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Event()
  public editBegin!: EventEmitter<void>;

  @Event()
  public editEnd!: EventEmitter<void>;

  @State()
  private line?: Line3.Line3;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private internalProjectionViewMatrix?: Matrix4.Matrix4;

  @State()
  private internalDepthBuffer?: DepthBuffer;

  @State()
  private measurementUnits = new MeasurementUnits(this.units);

  @Element()
  private hostEl!: HTMLElement;

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

  protected componentWillLoad(): void {
    this.updateViewport();
    this.updateLineFromProps();

    this.handleViewerChanged(this.viewer);
    this.handleEditableChanged();

    this.updateProjectionViewMatrix();
    this.updateDepthBuffer();
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
  protected render(): h.JSX.IntrinsicElements {
    const positions = this.computeElementPositions();
    if (positions != null) {
      const { startPt, endPt, labelPt, distance } = positions;

      return (
        <Host>
          <svg class="line">
            <line
              x1={startPt.x}
              y1={startPt.y}
              x2={endPt.x}
              y2={endPt.y}
            ></line>
          </svg>

          <div
            id="start-anchor"
            class="anchor-container"
            style={{ transform: cssTransformForPoint(startPt) }}
            onMouseDown={this.handleAnchorMouseDown('start')}
          >
            <slot name="start">
              <div class="anchor"></div>
            </slot>
          </div>

          <div
            id="end-anchor"
            class="anchor-container"
            style={{ transform: cssTransformForPoint(endPt) }}
            onMouseDown={this.handleAnchorMouseDown('end')}
          >
            <slot name="end">
              <div class="anchor"></div>
            </slot>
          </div>

          <div
            id="label"
            class="distance-label"
            style={{ transform: cssTransformForPoint(labelPt) }}
          >
            {this.formatDistance(distance)}
          </div>
        </Host>
      );
    } else {
      return <Host></Host>;
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
    this.updateProjectionViewMatrix();
  }

  /**
   * @ignore
   */
  @Watch('start')
  protected handleStartChanged(): void {
    this.updateLineFromProps();
  }

  /**
   * @ignore
   */
  @Watch('end')
  protected handleEndChanged(): void {
    this.updateLineFromProps();
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

  @Watch('editable')
  protected handleEditableChanged(): void {
    if (this.viewer != null && this.viewer.depthBuffers == null) {
      console.warn(
        'Measurement editing is disabled. <vertex-viewer> must have its `depth-buffers` attribute set.'
      );
    }
  }

  private computeElementPositions(): ElementPositions | undefined {
    if (this.internalProjectionViewMatrix != null && this.line != null) {
      return getViewingElementPositions(this.line, {
        projectionViewMatrix: this.internalProjectionViewMatrix,
        viewport: this.viewport,
        valid: !this.invalid,
      });
    } else {
      return undefined;
    }
  }

  private handleFrameDrawn = (): void => {
    this.updateProjectionViewMatrix();
    this.updateDepthBuffer();
  };

  private handleAnchorMouseDown(
    anchor: 'start' | 'end'
  ): ((event: MouseEvent) => void) | undefined {
    if (this.editable && this.internalDepthBuffer != null) {
      const originalPt = anchor === 'start' ? this.start : this.end;
      const originalInvalid = this.invalid;

      const resetIfInvalid = (): void => {
        if (this.invalid) {
          if (anchor === 'start') {
            this.start = originalPt;
          } else {
            this.end = originalPt;
          }
          this.invalid = originalInvalid;
        }
      };

      const handleMouseMove = (event: MouseEvent): void => {
        if (this.internalDepthBuffer != null) {
          const { left, top } = this.hostEl.getBoundingClientRect();
          const pt = Point.create(event.clientX - left, event.clientY - top);
          const framePt = this.viewport.transformPointToFrame(
            pt,
            this.internalDepthBuffer
          );
          const valid =
            this.internalDepthBuffer.getNormalizedDepthAtPoint(framePt) < 1;
          const worldPt = this.viewport.transformPointToWorldSpace(
            pt,
            this.internalDepthBuffer
          );

          if (anchor === 'start') {
            this.start = worldPt;
          } else {
            this.end = worldPt;
          }
          this.invalid = !valid;
        }
      };

      const handleMouseUp = (): void => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        resetIfInvalid();
        this.editEnd.emit();
      };

      return () => {
        this.editBegin.emit();

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      };
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
    const start = this.parseVector3(this.start);
    const end = this.parseVector3(this.end);
    this.line =
      start != null && end != null ? Line3.create({ start, end }) : undefined;
  }

  private parseVector3(
    value: string | Vector3.Vector3 | undefined
  ): Vector3.Vector3 | undefined {
    return typeof value === 'string' ? Vector3.fromJson(value) : value;
  }

  private updateViewport(): void {
    const { width, height } = getMeasurementBoundingClientRect(this.hostEl);
    this.viewport = new Viewport(width, height);
  }

  private formatDistance(distance: number | undefined): string {
    const realDistance =
      distance != null
        ? this.measurementUnits.translateWorldValueToReal(distance)
        : undefined;

    if (this.labelFormatter != null) {
      return this.labelFormatter(realDistance);
    } else {
      const abbreviated = this.measurementUnits.unit.abbreviatedName;
      return realDistance == null
        ? '--'
        : `~${realDistance.toFixed(this.fractionalDigits)} ${abbreviated}`;
    }
  }
}

function cssTransformForPoint(pt: Point.Point): string {
  return `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px)`;
}
