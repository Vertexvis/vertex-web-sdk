import { Matrix4, Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import {
  axisPositions,
  xAxisArrowPositions,
  yAxisArrowPositions,
  zAxisArrowPositions,
} from '../../lib/transforms/axis-arrows';
import { testTriangleMesh } from '../../lib/transforms/hits';
import {
  AxisMesh,
  computeMesh2dBounds,
  Mesh,
  OutlinedTriangleMesh,
} from '../../lib/transforms/mesh';
import { Frame, Viewport } from '../../lib/types';

export class TransformWidget {
  private reglCommand?: regl.Regl;

  private viewport: Viewport;
  private cursor?: Point.Point;

  private xAxis?: AxisMesh;
  private yAxis?: AxisMesh;
  private zAxis?: AxisMesh;
  private xArrow?: OutlinedTriangleMesh;
  private yArrow?: OutlinedTriangleMesh;
  private zArrow?: OutlinedTriangleMesh;

  private hoveredMesh?: Mesh;

  private frame?: Frame;
  private position?: Vector3.Vector3;
  private bounds?: Rectangle.Rectangle;

  public constructor(private canvasElement: HTMLCanvasElement) {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
  }

  public boundsContainsPoint(point: Point.Point): boolean {
    return (
      this.bounds != null &&
      this.frame != null &&
      Rectangle.containsPoints(
        this.bounds,
        this.viewport.transformScreenPointToNdc(point, this.frame.image)
      )
    );
  }

  public updateFrame(frame: Frame, redraw = true): void {
    this.frame = frame;
    if (redraw && frame != null && this.position != null) {
      this.createOrUpdateMeshes(this.position, frame);
      this.redraw();
    }
  }

  public updateCursor(cursor?: Point.Point): void {
    this.cursor = cursor;

    if (cursor != null && this.frame != null) {
      this.hitTestAndRedraw();
    }
  }

  public updatePosition(position?: Vector3.Vector3): void {
    this.position = position;

    if (position != null && this.frame != null) {
      this.createOrUpdateMeshes(position, this.frame);
      this.clear();
      this.redraw();
    } else {
      this.clear();
    }
  }

  public updateDimensions(canvasElement: HTMLCanvasElement): void {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
    this.reglCommand = regl(canvasElement);

    this.redraw();
  }

  public hovered(): Mesh | undefined {
    return this.hoveredMesh;
  }

  private redraw(): void {
    console.log('redraw');

    const disposable = this.reglCommand?.frame(() => {
      this.getTriangleMeshes().forEach((m) => {
        m.draw({
          fill:
            m.identifier === this.hoveredMesh?.identifier
              ? [255, 255, 0]
              : Vector3.toArray(m.fillColor),
        });
      });

      this.getAxisMeshes().forEach((m) => m.draw());

      disposable?.cancel();
    });
  }

  private clear(): void {
    this.reglCommand?.clear({
      color: [0, 0, 0, 0],
    });
  }

  private hitTestAndRedraw(): void {
    const previousHovered = this.hoveredMesh;
    this.hoveredMesh = undefined;

    const currentFrame = this.frame;

    if (currentFrame != null) {
      this.getTriangleMeshes().forEach((m) => {
        const isHovered =
          this.cursor != null && m != null
            ? testTriangleMesh(this.viewport, this.cursor, currentFrame, m)
            : false;

        if (isHovered) {
          this.hoveredMesh = m;
        }
      });
    }

    if (this.hoveredMesh !== previousHovered) {
      this.redraw();
    }
  }

  private getAxisMeshes(): AxisMesh[] {
    if (this.xAxis != null && this.yAxis != null && this.zAxis != null) {
      return [this.xAxis, this.yAxis, this.zAxis];
    }
    return [];
  }

  private getTriangleMeshes(): OutlinedTriangleMesh[] {
    if (this.xArrow != null && this.yArrow != null && this.zArrow != null) {
      return [this.xArrow, this.yArrow, this.zArrow];
    }
    return [];
  }

  private createOrUpdateMeshes(position: Vector3.Vector3, frame: Frame): void {
    if (this.xArrow == null || this.yArrow == null || this.zArrow == null) {
      this.createMeshes(position, frame);
    } else {
      this.updateMeshes(position, frame);
    }

    this.bounds = computeMesh2dBounds(...this.getTriangleMeshes());
  }

  private createMeshes(position: Vector3.Vector3, frame: Frame): void {
    this.reglCommand = regl({
      canvas: this.canvasElement,
      extensions: ['ANGLE_instanced_arrays'],
    });
    const { createShape } = shapeBuilder(this.reglCommand);

    const triangleSize =
      Vector3.magnitude(
        Vector3.subtract(position, frame.scene.camera.position)
      ) * 0.005;

    this.xArrow = new OutlinedTriangleMesh(
      createShape,
      'x-translate',
      xAxisArrowPositions(position, frame.scene.camera, triangleSize),
      Vector3.create(),
      Vector3.create(255, 0, 0)
    );
    this.xAxis = new AxisMesh(
      createShape,
      'x-axis',
      axisPositions(position, frame.scene.camera, this.xArrow),
      Vector3.create(),
      Vector3.create(255, 0, 0)
    );
    this.yArrow = new OutlinedTriangleMesh(
      createShape,
      'y-translate',
      yAxisArrowPositions(position, frame.scene.camera, triangleSize),
      Vector3.create(),
      Vector3.create(0, 255, 0)
    );
    this.yAxis = new AxisMesh(
      createShape,
      'y-axis',
      axisPositions(position, frame.scene.camera, this.yArrow),
      Vector3.create(),
      Vector3.create(0, 255, 0)
    );
    this.zArrow = new OutlinedTriangleMesh(
      createShape,
      'z-translate',
      zAxisArrowPositions(position, frame.scene.camera, triangleSize),
      Vector3.create(),
      Vector3.create(0, 0, 255)
    );
    this.zAxis = new AxisMesh(
      createShape,
      'z-axis',
      axisPositions(position, frame.scene.camera, this.zArrow),
      Vector3.create(),
      Vector3.create(0, 0, 255)
    );
  }

  private updateMeshes(position: Vector3.Vector3, frame: Frame): void {
    const triangleSize =
      Vector3.magnitude(
        Vector3.subtract(position, frame.scene.camera.position)
      ) * 0.005;

    if (this.xArrow != null) {
      this.xArrow.updatePoints(
        xAxisArrowPositions(position, frame.scene.camera, triangleSize)
      );
      this.xAxis?.updatePoints(
        axisPositions(position, frame.scene.camera, this.xArrow)
      );
    }

    if (this.yArrow != null) {
      this.yArrow.updatePoints(
        yAxisArrowPositions(position, frame.scene.camera, triangleSize)
      );
      this.yAxis?.updatePoints(
        axisPositions(position, frame.scene.camera, this.yArrow)
      );
    }

    if (this.zArrow != null) {
      this.zArrow.updatePoints(
        zAxisArrowPositions(position, frame.scene.camera, triangleSize)
      );
      this.zAxis?.updatePoints(
        axisPositions(position, frame.scene.camera, this.zArrow)
      );
    }
  }
}
