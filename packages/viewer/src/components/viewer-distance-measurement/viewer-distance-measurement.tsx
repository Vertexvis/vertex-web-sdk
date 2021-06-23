import {
  Component,
  Host,
  h,
  Prop,
  State,
  Watch,
  Element,
  Method,
} from '@stencil/core';
import { Line3, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { MeasurementUnits, UnitType, Viewport } from '../../lib/types';
import { getMeasurementBoundingClientRect } from './utils';

interface ElementPositions {
  startPt: Point.Point;
  endPt: Point.Point;
  labelPt: Point.Point;
}

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
  distance: number
) => string;

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
  @Prop()
  public start: Vector3.Vector3 | string = Vector3.origin();

  /**
   * The position of the ending anchor. Can either be an instance of a `Vector3`
   * or a JSON string representation in the format of `[x, y, z]` or `{"x": 0,
   * "y": 0, "z": 0}`.
   */
  @Prop()
  public end: Vector3.Vector3 | string = Vector3.origin();

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
   * The projection view matrix used to position the anchors. If `viewer` is
   * defined, then the projection view matrix of the viewer will be used.
   */
  @Prop()
  public projectionViewMatrix?: Matrix4.Matrix4;

  /**
   * The viewer to connect to this measurement. The measurement will redraw any
   * time the viewer redraws the scene.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @State()
  private line: Line3.Line3 = Line3.create();

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private renderProjectionViewMatrix?: Matrix4.Matrix4;

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
  public async computeElementMetrics(): Promise<ViewerDistanceMeasurementElementMetrics> {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const startAnchorEl = this.hostEl.shadowRoot?.getElementById(
      'start-anchor'
    );
    const endAnchorEl = this.hostEl.shadowRoot?.getElementById('end-anchor');
    const labelEl = this.hostEl.shadowRoot?.getElementById('label');

    return {
      startAnchor: startAnchorEl!.getBoundingClientRect(),
      endAnchor: endAnchorEl!.getBoundingClientRect(),
      label: labelEl!.getBoundingClientRect(),
    };
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  }

  protected componentWillLoad(): void {
    this.updateViewport();
    this.handleViewerChanged(this.viewer);
    this.updateLineFromProps();
    this.updateProjectionViewMatrix();
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
      const { startPt, endPt, labelPt } = positions;

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
          >
            <slot name="start">
              <div class="anchor"></div>
            </slot>
          </div>
          <div
            id="end-anchor"
            class="anchor-container"
            style={{ transform: cssTransformForPoint(endPt) }}
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
            {this.formatDistance()}
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

  @Watch('projectionViewMatrix')
  protected handleProjectionViewMatrixChanged(): void {
    this.updateProjectionViewMatrix();
  }

  private computeElementPositions(): ElementPositions | undefined {
    if (this.renderProjectionViewMatrix != null) {
      const lineNdc = Line3.transformMatrix(
        this.line,
        this.renderProjectionViewMatrix
      );
      const labelNdc = Vector3.transformMatrix(
        Line3.center(this.line),
        this.renderProjectionViewMatrix
      );

      return {
        startPt: this.viewport.transformPointToViewport(lineNdc.start),
        endPt: this.viewport.transformPointToViewport(lineNdc.end),
        labelPt: this.viewport.transformPointToViewport(labelNdc),
      };
    } else {
      return undefined;
    }
  }

  private handleFrameDrawn = (): void => {
    this.updateProjectionViewMatrix();
  };

  private updateProjectionViewMatrix(): void {
    this.renderProjectionViewMatrix =
      this.projectionViewMatrix ||
      this.viewer?.frame?.scene.camera.projectionViewMatrix;
  }

  private updateLineFromProps(): void {
    const start =
      typeof this.start === 'string'
        ? Vector3.fromJson(this.start)
        : this.start;
    const end =
      typeof this.end === 'string' ? Vector3.fromJson(this.end) : this.end;
    this.line = Line3.create({ start, end });
  }

  private updateViewport(): void {
    const { width, height } = getMeasurementBoundingClientRect(this.hostEl);
    this.viewport = new Viewport(width, height);
  }

  private formatDistance(): string {
    const distance = this.measurementUnits.translateWorldValueToReal(
      Line3.distance(this.line)
    );

    if (this.labelFormatter != null) {
      return this.labelFormatter(distance);
    } else {
      const abbreviated = this.measurementUnits.unit.abbreviatedName;
      return `~${distance.toFixed(this.fractionalDigits)} ${abbreviated}`;
    }
  }
}

function cssTransformForPoint(pt: Point.Point): string {
  return `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px)`;
}
