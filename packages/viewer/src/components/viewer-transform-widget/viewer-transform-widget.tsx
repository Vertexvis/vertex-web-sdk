import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import {
  Matrix4,
  Plane,
  Point,
  Ray,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import classNames from 'classnames';

import { TransformController } from '../../lib/transforms/controller';
import { Mesh } from '../../lib/transforms/mesh';
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
  public position?: Vector3.Vector3;

  @Prop({ mutable: true })
  public currentPosition?: Vector3.Vector3;

  @Prop({ mutable: true })
  public controller?: TransformController;

  @Prop({ reflect: true, mutable: true })
  public hovered?: string;

  @State()
  private draggingMesh?: Mesh;

  @State()
  private lastWorldPosition?: Vector3.Vector3;

  @State()
  private widgetScreenBounds?: Rectangle.Rectangle;

  private canvasBounds?: DOMRect;
  private canvasRef?: HTMLCanvasElement;
  private transformGlWidget?: TransformGlWidget;

  protected componentDidLoad(): void {
    window.addEventListener('pointermove', this.handleWindowPointerMove);
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
    oldViewer?.removeEventListener(
      'dimensionschange',
      this.handleViewerDimensionsChanged
    );
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener(
      'dimensionschange',
      this.handleViewerDimensionsChanged
    );

    if (newViewer?.stream != null) {
      this.controller?.dispose();
      this.controller = new TransformController(newViewer.stream);
    }

    if (this.canvasRef != null && newViewer != null) {
      this.canvasRef.width = newViewer.clientWidth;
      this.canvasRef.height = newViewer.clientHeight;
    }
  }

  @Watch('position')
  protected handlePositionChanged(): void {
    this.currentPosition = this.position;
    this.getTransformWidget()?.updatePosition(this.currentPosition);

    if (this.position == null) {
      this.controller?.clearTransform();
    }
  }

  @Watch('currentPosition')
  protected handleCurrentPositionChanged(): void {
    if (this.currentPosition != null) {
      const widget = this.getTransformWidget();

      widget?.updatePosition(this.currentPosition);
      this.widgetScreenBounds = widget?.getWidgetBounds();
    }
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        {
          <canvas
            ref={(el) => {
              this.canvasRef = el;
            }}
            class={classNames('widget', {
              hovered: this.getTransformWidget()?.hovered() != null,
            })}
            onPointerDown={this.handlePointerDown}
          />
        }
      </Host>
    );
  }

  private handleViewerFrameDrawn = (): void => {
    this.updatePropsFromViewer();
  };

  private handleViewerDimensionsChanged = (): void => {
    if (
      this.canvasRef != null &&
      this.viewer != null &&
      this.viewer.frame != null
    ) {
      this.canvasRef.width = this.viewer.viewport.width;
      this.canvasRef.height = this.viewer.viewport.height;
      this.canvasBounds = this.canvasRef?.getBoundingClientRect();

      this.getTransformWidget()?.updateDimensions(this.canvasRef);
    }
  };

  private handleWindowPointerMove = (event: PointerEvent): void => {
    const canvasPoint = this.pointToCanvas(
      Point.create(event.clientX, event.clientY)
    );
    const widget = this.getTransformWidget();

    if (canvasPoint != null && this.isPointWithinWidgetBounds(canvasPoint)) {
      widget?.updateCursor(canvasPoint);
      this.hovered = widget?.hovered()?.identifier;
    } else {
      widget?.updateCursor(undefined);
      this.hovered = undefined;
    }
  };

  private handlePointerDown = async (event: PointerEvent): Promise<void> => {
    const hoveredMesh = this.getTransformWidget()?.hovered();

    if (hoveredMesh != null) {
      this.draggingMesh = hoveredMesh;
      const canvasPosition = this.pointToCanvas(
        Point.create(event.clientX, event.clientY)
      );
      this.lastWorldPosition =
        canvasPosition != null
          ? await this.pointToWorld(canvasPosition)
          : undefined;

      this.controller?.beginTransform();

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
    this.lastWorldPosition = undefined;

    this.controller?.endTransform();

    window.addEventListener('pointermove', this.handleWindowPointerMove);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
  };

  private updatePropsFromViewer = (): void => {
    const { frame } = this.viewer || {};

    if (frame != null) {
      const widget = this.getTransformWidget();

      widget?.updateFrame(frame);
      this.widgetScreenBounds = widget?.getWidgetBounds();
    }
  };

  private async pointToWorld(
    point: Point.Point
  ): Promise<Vector3.Vector3 | undefined> {
    const { frame } = this.viewer || {};

    if (frame != null && this.currentPosition != null && this.viewer != null) {
      const viewport = this.viewer?.viewport;

      const ray = viewport.transformPointToRay(
        point,
        frame.image,
        frame.scene.camera
      );
      const positionPlane = Plane.fromNormalAndCoplanarPoint(
        frame.scene.camera.direction,
        this.currentPosition
      );
      return Ray.intersectPlane(ray, positionPlane);
    }
    return undefined;
  }

  private pointToCanvas(point: Point.Point): Point.Point | undefined {
    const canvasBounds = this.getCanvasBounds();

    if (
      canvasBounds != null &&
      this.canvasRef != null &&
      Rectangle.containsPoints(canvasBounds, point)
    ) {
      return Point.create(
        point.x - canvasBounds.left,
        point.y - canvasBounds.top
      );
    }

    return undefined;
  }

  private isPointWithinWidgetBounds(point: Point.Point): boolean {
    if (
      this.widgetScreenBounds != null &&
      Rectangle.containsPoints(this.widgetScreenBounds, point)
    ) {
      return true;
    }
    return false;
  }

  private transform(previous: Vector3.Vector3, next: Vector3.Vector3): void {
    const { frame } = this.viewer || {};

    if (
      frame != null &&
      this.position != null &&
      this.currentPosition != null
    ) {
      if (this.draggingMesh?.identifier === 'x-translate') {
        this.currentPosition = {
          ...this.currentPosition,
          x: Vector3.subtract(next, previous).x + this.currentPosition.x,
        };

        this.controller?.updateTransform(
          Matrix4.makeTranslation(
            Vector3.subtract(this.position, this.currentPosition)
          )
        );
      } else if (this.draggingMesh?.identifier === 'y-translate') {
        this.currentPosition = {
          ...this.currentPosition,
          y: Vector3.subtract(next, previous).y + this.currentPosition.y,
        };

        this.controller?.updateTransform(
          Matrix4.makeTranslation(
            Vector3.subtract(this.position, this.currentPosition)
          )
        );
      } else if (this.draggingMesh?.identifier === 'z-translate') {
        this.currentPosition = {
          ...this.currentPosition,
          z: Vector3.subtract(next, previous).z + this.currentPosition.z,
        };

        this.controller?.updateTransform(
          Matrix4.makeTranslation(
            Vector3.subtract(this.position, this.currentPosition)
          )
        );
      }
    }
  }

  private getCanvasBounds = (): DOMRect | undefined => {
    if (this.canvasBounds != null) {
      return this.canvasBounds;
    } else if (this.canvasRef != null) {
      this.canvasBounds = this.canvasRef?.getBoundingClientRect();
      return this.canvasBounds;
    }
  };

  private getTransformWidget = (): TransformGlWidget | undefined => {
    if (this.canvasRef != null) {
      this.transformGlWidget =
        this.transformGlWidget ?? new TransformGlWidget(this.canvasRef);
      return this.transformGlWidget;
    }
  };
}
