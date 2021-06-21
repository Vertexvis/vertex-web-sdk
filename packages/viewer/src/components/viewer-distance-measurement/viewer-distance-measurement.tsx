import { Component, Host, h, Prop, State, Watch, Element } from '@stencil/core';
import { Line3, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { Viewport } from '../../lib/types';

@Component({
  tag: 'vertex-viewer-distance-measurement',
  styleUrl: 'viewer-distance-measurement.css',
  shadow: true,
})
export class ViewerDistanceMeasurement {
  @Prop()
  public start: Vector3.Vector3 | string = Vector3.origin();

  @Prop()
  public end: Vector3.Vector3 | string = Vector3.origin();

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @State()
  private line: Line3.Line3 = Line3.create();

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private projectionViewMatrix?: Matrix4.Matrix4;

  @State()
  private startPt?: Point.Point;

  @State()
  private endPt?: Point.Point;

  @Element()
  private hostEl!: HTMLElement;

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.handleViewerChanged(this.viewer);
    this.updateLineFromProps();
    this.updateViewport();
  }

  /**
   * @ignore
   */
  protected componentWillRender(): void {
    if (this.projectionViewMatrix != null) {
      const lineNdc = Line3.transformMatrix(
        this.line,
        this.projectionViewMatrix
      );
      this.startPt = this.viewport.transformPointToViewport(lineNdc.start);
      this.endPt = this.viewport.transformPointToViewport(lineNdc.end);
    } else {
      this.startPt = undefined;
      this.endPt = undefined;
    }
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    if (this.startPt != null && this.endPt != null) {
      return (
        <Host
          style={{
            visibility:
              this.startPt != null && this.endPt != null ? 'inherit' : 'hidden',
          }}
        >
          <svg class="line">
            <line
              x1={this.startPt.x}
              y1={this.startPt.y}
              x2={this.endPt.x}
              y2={this.endPt.y}
            ></line>
          </svg>
          <div
            class="anchor-container"
            style={{ transform: cssTransformForPoint(this.startPt) }}
          >
            <slot name="start">
              <div class="anchor"></div>
            </slot>
          </div>
          <div
            class="anchor-container"
            style={{ transform: cssTransformForPoint(this.endPt) }}
          >
            <slot name="end">
              <div class="anchor"></div>
            </slot>
          </div>
        </Host>
      );
    } else {
      return <Host></Host>;
    }
  }

  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleFrameDrawn);
    this.updateProjectionViewMatrix();
  }

  @Watch('start')
  protected handleStartChanged(): void {
    this.updateLineFromProps();
  }

  @Watch('end')
  protected handleEndChanged(): void {
    this.updateLineFromProps();
  }

  private handleFrameDrawn = (): void => {
    this.updateProjectionViewMatrix();
  };

  private updateProjectionViewMatrix(): void {
    this.projectionViewMatrix = this.viewer?.frame?.scene.camera.projectionViewMatrix;
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
    const { width, height } = this.hostEl.getBoundingClientRect();
    this.viewport = new Viewport(width, height);
  }
}

function cssTransformForPoint(pt: Point.Point): string {
  return `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px)`;
}
