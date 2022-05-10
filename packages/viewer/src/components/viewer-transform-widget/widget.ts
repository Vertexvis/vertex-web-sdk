import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { Color, Disposable, EventDispatcher, Listener } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import { axisPositions } from '../../lib/transforms/axis';
import {
  xAxisArrowPositions,
  yAxisArrowPositions,
  zAxisArrowPositions,
} from '../../lib/transforms/axis-arrows';
import { testTriangleMesh } from '../../lib/transforms/hits';
import {
  AxisMesh,
  computeMesh2dBounds,
  Mesh,
  TriangleMesh,
} from '../../lib/transforms/mesh';
import { Frame, Viewport } from '../../lib/types';

export class TransformWidget implements Disposable {
  private reglCommand?: regl.Regl;

  private viewport: Viewport;
  private cursor?: Point.Point;

  private xAxis?: AxisMesh;
  private yAxis?: AxisMesh;
  private zAxis?: AxisMesh;
  private xArrow?: TriangleMesh;
  private yArrow?: TriangleMesh;
  private zArrow?: TriangleMesh;

  private axisMeshes: AxisMesh[] = [];
  private triangleMeshes: TriangleMesh[] = [];
  private drawableMeshes: Mesh[] = [];
  private hoveredMesh?: Mesh;

  private frame?: Frame;
  private position?: Vector3.Vector3;
  private bounds?: Rectangle.Rectangle;

  private reglFrameDisposable?: regl.Cancellable;

  private hoveredChanged = new EventDispatcher<Mesh | undefined>();

  public constructor(private canvasElement: HTMLCanvasElement) {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
  }

  public dispose(): void {
    this.reglFrameDisposable?.cancel();
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

  public updateFrame(frame: Frame, updateMeshes = true): void {
    this.frame = frame;

    if (updateMeshes && frame != null && this.position != null) {
      this.createOrUpdateMeshes(this.position, frame);
      this.sortMeshes(frame, ...this.axisMeshes, ...this.triangleMeshes);
    }
  }

  public updateCursor(cursor?: Point.Point): void {
    this.cursor = cursor;

    if (cursor != null && this.frame != null) {
      this.updateHovered();
    }
  }

  public updatePosition(position?: Vector3.Vector3): void {
    this.position = position;

    if (position != null && this.frame != null) {
      this.createOrUpdateMeshes(position, this.frame);
      this.sortMeshes(this.frame, ...this.axisMeshes, ...this.triangleMeshes);
      this.draw();
    } else {
      this.clear();
      this.reglFrameDisposable?.cancel();
      this.reglFrameDisposable = undefined;
    }
  }

  public updateDimensions(canvasElement: HTMLCanvasElement): void {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
    this.reglCommand = regl(canvasElement);
  }

  public onHoveredChanged(listener: Listener<Mesh | undefined>): Disposable {
    return this.hoveredChanged.on(listener);
  }

  private draw(): void {
    if (this.reglFrameDisposable == null) {
      this.reglFrameDisposable = this.reglCommand?.frame(() => {
        this.drawableMeshes.forEach((m) => m.draw({ fill: m.fillColor }));
      });
    }
  }

  private clear(): void {
    this.reglCommand?.clear({
      color: [0, 0, 0, 0],
    });
  }

  private updateHovered(): void {
    const previousHovered = this.hoveredMesh;
    const currentFrame = this.frame;

    if (currentFrame != null) {
      this.hoveredMesh = this.triangleMeshes.find((m) => {
        const isHovered =
          this.cursor != null
            ? testTriangleMesh(this.viewport, this.cursor, currentFrame, m)
            : false;

        return isHovered;
      });

      if (this.hoveredMesh !== previousHovered) {
        this.hoveredChanged.emit(this.hoveredMesh);
        this.hoveredMesh?.updateFillColor('#ffff00');
        previousHovered?.updateFillColor(previousHovered?.initialFillColor);
      }
    }
  }

  private sortMeshes(frame: Frame, ...meshes: Mesh[]): void {
    const compare = (m1: Mesh, m2: Mesh): number =>
      m1.points.shortestDistanceFrom(frame.scene.camera.position) -
      m2.points.shortestDistanceFrom(frame.scene.camera.position);

    this.axisMeshes = this.axisMeshes.sort(compare);
    this.triangleMeshes = this.triangleMeshes.sort(compare);

    // Reverse sorted meshes to draw the closest mesh last.
    // This causes it to appear above any other mesh.
    this.drawableMeshes = meshes
      .filter((m) => m.points.valid)
      .sort(compare)
      .reverse();
  }

  private createOrUpdateMeshes(position: Vector3.Vector3, frame: Frame): void {
    if (this.xArrow == null || this.yArrow == null || this.zArrow == null) {
      this.createMeshes(position, frame);
    } else {
      this.updateMeshes(position, frame);
    }

    this.bounds = computeMesh2dBounds(...this.triangleMeshes);
  }

  private createMeshes(position: Vector3.Vector3, frame: Frame): void {
    this.reglCommand = regl({
      canvas: this.canvasElement,
      extensions: ['ANGLE_instanced_arrays'],
    });
    const { createShape } = shapeBuilder(this.reglCommand);

    const triangleSize = this.computeTriangleSize(position, frame);

    this.xArrow = new TriangleMesh(
      createShape,
      'x-translate',
      xAxisArrowPositions(position, frame.scene.camera, triangleSize),
      Color.fromHexString('#000000'),
      Color.fromHexString('#ff0000')
    );
    this.xAxis = new AxisMesh(
      createShape,
      'x-axis',
      axisPositions(position, frame.scene.camera, this.xArrow),
      Color.fromHexString('#000000'),
      Color.fromHexString('#ff0000')
    );
    this.yArrow = new TriangleMesh(
      createShape,
      'y-translate',
      yAxisArrowPositions(position, frame.scene.camera, triangleSize),
      Color.fromHexString('#000000'),
      Color.fromHexString('#00ff00')
    );
    this.yAxis = new AxisMesh(
      createShape,
      'y-axis',
      axisPositions(position, frame.scene.camera, this.yArrow),
      Color.fromHexString('#000000'),
      Color.fromHexString('#00ff00')
    );
    this.zArrow = new TriangleMesh(
      createShape,
      'z-translate',
      zAxisArrowPositions(position, frame.scene.camera, triangleSize),
      Color.fromHexString('#000000'),
      Color.fromHexString('#0000ff')
    );
    this.zAxis = new AxisMesh(
      createShape,
      'z-axis',
      axisPositions(position, frame.scene.camera, this.zArrow),
      Color.fromHexString('#000000'),
      Color.fromHexString('#0000ff')
    );

    this.axisMeshes = [this.xAxis, this.yAxis, this.zAxis];
    this.triangleMeshes = [this.xArrow, this.yArrow, this.zArrow];
  }

  private updateMeshes(position: Vector3.Vector3, frame: Frame): void {
    const triangleSize = this.computeTriangleSize(position, frame);

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

  private computeTriangleSize(position: Vector3.Vector3, frame: Frame): number {
    return (
      Vector3.magnitude(
        Vector3.subtract(position, frame.scene.camera.position)
      ) * 0.005
    );
  }
}
