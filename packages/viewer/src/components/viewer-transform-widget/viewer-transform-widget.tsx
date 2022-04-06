import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { Plane, Point, Ray, Vector3 } from '@vertexvis/geometry';
import classNames from 'classnames';

import { Viewport } from '../..';
import { Mesh } from './mesh';
import { TransformGlWidget } from './widget';

@Component({
  tag: 'vertex-viewer-transform-widget',
  styleUrl: 'viewer-transform-widget.css',
  shadow: true,
})
export class ViewerTransformWidget {
  /**
   * The viewer to connect to measurements. If nested within a <vertex-viewer>,
   * this property will be populated automatically.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The starting position of this transform widget. This position will be updated
   * as translation occurs.
   */
  @Prop({ mutable: true })
  public position: Vector3.Vector3 = Vector3.create();

  @State()
  private draggingMesh?: Mesh;

  @State()
  private lastWorldPosition?: Vector3.Vector3;

  @State()
  private hoveredMeshIdentifier?: string;

  private canvasBounds?: DOMRect;
  private canvasRef?: HTMLCanvasElement;
  private transformGlWidget?: TransformGlWidget;

  protected componentDidLoad(): void {
    window.addEventListener('pointermove', this.handleWindowPointerMove);
  }

  protected componentDidRender(): void {
    this.canvasBounds = this.canvasRef?.getBoundingClientRect();

    if (this.canvasRef != null) {
      this.transformGlWidget = new TransformGlWidget(this.canvasRef);
      this.transformGlWidget?.updatePosition(this.position);
      this.updatePropsFromViewer();
    }
  }

  protected disconnectedCallback(): void {
    window.removeEventListener('pointermove', this.handleWindowPointerMove);
  }

  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);

    if (this.canvasRef != null && newViewer != null) {
      this.canvasRef.width = newViewer.clientWidth;
      this.canvasRef.height = newViewer.clientHeight;
    }
  }

  @Watch('position')
  protected handlePositionChanged(): void {
    // if (this.viewer?.frame != null) {
    //   const viewport = Viewport.fromDimensions(this.viewer.frame.dimensions);
    //   this.viewportPosition = viewport.transformWorldToViewport(
    //     this.position,
    //     this.viewer.frame.scene.camera.projectionViewMatrix
    //   );
    // }

    this.transformGlWidget?.updatePosition(this.position);
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <canvas
          ref={(el) => {
            this.canvasRef = el;
          }}
          class={classNames('widget', {
            hovered: this.transformGlWidget?.hovered() != null,
          })}
          onPointerDown={this.handlePointerDown}
        />
      </Host>
    );
  }

  private handleViewerFrameDrawn = async (): Promise<void> => {
    this.updatePropsFromViewer();
  };

  private handleWindowPointerMove = (event: PointerEvent): void => {
    const canvasPoint = this.pointToCanvas(
      Point.create(event.clientX, event.clientY)
    );

    if (canvasPoint != null) {
      this.transformGlWidget?.updateCursor(canvasPoint);
      this.hoveredMeshIdentifier =
        this.transformGlWidget?.hovered()?.identifier;
    }
  };

  private handlePointerDown = async (event: PointerEvent): Promise<void> => {
    const hoveredMesh = this.transformGlWidget?.hovered();

    if (hoveredMesh != null) {
      this.draggingMesh = hoveredMesh;
      const canvasPosition = this.pointToCanvas(
        Point.create(event.clientX, event.clientY)
      );
      this.lastWorldPosition =
        canvasPosition != null
          ? await this.pointToWorld(canvasPosition)
          : undefined;

      window.removeEventListener('pointermove', this.handleWindowPointerMove);
      window.addEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('pointerup', this.handlePointerUp);
    }
  };

  private handlePointerMove = async (event: PointerEvent): Promise<void> => {
    const canvasPoint = this.pointToCanvas(
      Point.create(event.clientX, event.clientY)
    );

    if (
      this.draggingMesh != null &&
      this.lastWorldPosition != null &&
      canvasPoint != null
    ) {
      const currentWorld = await this.pointToWorld(canvasPoint);

      this.transform(
        this.lastWorldPosition,
        currentWorld ?? this.lastWorldPosition
      );

      this.lastWorldPosition = currentWorld;
    }
  };

  private handlePointerUp = (): void => {
    this.draggingMesh = undefined;

    window.addEventListener('pointermove', this.handleWindowPointerMove);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
  };

  private async updatePropsFromViewer(): Promise<void> {
    const { frame } = this.viewer || {};

    if (frame != null) {
      this.transformGlWidget?.updateFrame(frame);
    }
  }

  private async pointToWorld(
    point: Point.Point
  ): Promise<Vector3.Vector3 | undefined> {
    const { frame } = this.viewer || {};
    const depthBuffer = await frame?.depthBuffer();

    if (frame != null && depthBuffer != null) {
      const viewport = Viewport.fromDimensions(frame.dimensions);

      const ray = viewport.transformPointToRay(
        point,
        frame.image,
        frame.scene.camera
      );
      const positionPlane = Plane.fromNormalAndCoplanarPoint(
        frame.scene.camera.direction,
        this.position
      );
      return Ray.intersectPlane(ray, positionPlane);
    }
    return undefined;
  }

  private pointToCanvas(point: Point.Point): Point.Point | undefined {
    if (
      this.canvasBounds != null &&
      this.canvasRef != null &&
      point.x > this.canvasBounds.left &&
      point.x < this.canvasBounds.right &&
      point.y > this.canvasBounds.top &&
      point.y < this.canvasBounds.bottom
    ) {
      return Point.create(
        point.x - this.canvasBounds.left,
        point.y - this.canvasBounds.top
      );
    }

    return undefined;
  }

  private transform(previous: Vector3.Vector3, next: Vector3.Vector3): void {
    const { frame } = this.viewer || {};

    if (frame != null) {
      if (this.draggingMesh?.identifier === 'x-translate') {
        this.position = {
          ...this.position,
          x: Vector3.subtract(next, previous).x + this.position.x,
        };

        this.transformGlWidget?.updatePosition(this.position);
      } else if (this.draggingMesh?.identifier === 'y-translate') {
        this.position = {
          ...this.position,
          y: Vector3.subtract(next, previous).y + this.position.y,
        };

        this.transformGlWidget?.updatePosition(this.position);
      } else if (this.draggingMesh?.identifier === 'z-translate') {
        this.position = {
          ...this.position,
          z: Vector3.subtract(next, previous).z + this.position.z,
        };

        this.transformGlWidget?.updatePosition(this.position);
      }
    }
  }
}
