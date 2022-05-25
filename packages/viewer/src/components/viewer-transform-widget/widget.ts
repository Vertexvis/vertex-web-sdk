import { Matrix4 } from '@vertexvis/geometry';
import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { Color, Disposable, EventDispatcher, Listener } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import { axisPositions } from '../../lib/transforms/axis-lines';
import {
  xAxisRotationPositions,
  yAxisRotationPositions,
  zAxisRotationPositions,
} from '../../lib/transforms/axis-rotation';
import {
  xAxisArrowPositions,
  yAxisArrowPositions,
  zAxisArrowPositions,
} from '../../lib/transforms/axis-translation';
import { testMesh } from '../../lib/transforms/hits';
import {
  AxisMesh,
  computeMesh2dBounds,
  DiamondMesh,
  Mesh,
  TriangleMesh,
} from '../../lib/transforms/mesh';
import { Frame, Viewport } from '../../lib/types';

export interface MeshColors {
  xArrow?: Color.Color | string;
  yArrow?: Color.Color | string;
  zArrow?: Color.Color | string;
  hovered?: Color.Color | string;
  outline?: Color.Color | string;
}

// Scalar that is used in combination with the camera
// components to determine the relative size of the meshes.
// This attempts to keep the widget approximately the same
// size as zooming occurs.
export const DEFAULT_MESH_SCALAR = 0.005;

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
  private xRotation?: DiamondMesh;
  private yRotation?: DiamondMesh;
  private zRotation?: DiamondMesh;

  private axisMeshes: AxisMesh[] = [];
  private triangleMeshes: TriangleMesh[] = [];
  private diamondMeshes: DiamondMesh[] = [];
  private drawableMeshes: Mesh[] = [];
  private hoveredMesh?: Mesh;

  private frame?: Frame;
  private transform?: Matrix4.Matrix4;
  private bounds?: Rectangle.Rectangle;

  private reglFrameDisposable?: regl.Cancellable;

  private hoveredChanged = new EventDispatcher<Mesh | undefined>();

  private xArrowFillColor?: Color.Color | string;
  private yArrowFillColor?: Color.Color | string;
  private zArrowFillColor?: Color.Color | string;
  private hoveredArrowFillColor?: Color.Color | string;
  private outlineColor?: Color.Color | string;

  public constructor(
    private canvasElement: HTMLCanvasElement,
    colors: MeshColors = {}
  ) {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);

    this.xArrowFillColor = colors.xArrow;
    this.yArrowFillColor = colors.yArrow;
    this.zArrowFillColor = colors.zArrow;
    this.hoveredArrowFillColor = colors.hovered;
    this.outlineColor = colors.outline;
  }

  public dispose(): void {
    this.reglFrameDisposable?.cancel();
  }

  /**
   * @internal - visible for testing
   */
  public getDrawableMeshes(): Mesh[] {
    return this.drawableMeshes;
  }

  public boundsContainsPoint(point: Point.Point): boolean {
    return (
      this.bounds != null &&
      this.frame != null &&
      Rectangle.containsPoints(this.bounds, point)
    );
  }

  public updateFrame(frame: Frame, updateMeshes = true): void {
    this.frame = frame;

    if (updateMeshes && frame != null && this.transform != null) {
      this.createOrUpdateMeshes(this.transform, frame);
      this.sortMeshes(
        frame,
        ...this.axisMeshes,
        ...this.triangleMeshes,
        ...this.diamondMeshes
      );
      this.draw();
    }
  }

  public updateCursor(cursor?: Point.Point): void {
    this.cursor = cursor;

    if (cursor != null && this.frame != null) {
      this.updateHovered();
    } else {
      this.clearHovered();
    }
  }

  public updateTransform(transform?: Matrix4.Matrix4): void {
    this.transform = transform;

    if (transform != null && this.frame != null) {
      this.createOrUpdateMeshes(transform, this.frame);
      this.sortMeshes(
        this.frame,
        ...this.axisMeshes,
        ...this.triangleMeshes,
        ...this.diamondMeshes
      );
      this.draw();
    } else {
      this.clear();
      this.reglFrameDisposable?.cancel();
      this.reglFrameDisposable = undefined;
    }
  }

  public updateColors(colors: MeshColors): void {
    this.xArrowFillColor = colors.xArrow ?? this.xArrowFillColor;
    this.yArrowFillColor = colors.yArrow ?? this.yArrowFillColor;
    this.zArrowFillColor = colors.zArrow ?? this.zArrowFillColor;
    this.hoveredArrowFillColor = colors.hovered ?? this.hoveredArrowFillColor;
    this.outlineColor = colors.outline ?? this.outlineColor;

    this.xArrow?.updateFillColor(this.xArrowFillColor);
    this.yArrow?.updateFillColor(this.yArrowFillColor);
    this.zArrow?.updateFillColor(this.zArrowFillColor);
    this.hoveredMesh?.updateFillColor(this.hoveredArrowFillColor);
  }

  public updateDimensions(canvasElement: HTMLCanvasElement): void {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);
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
      this.hoveredMesh = [...this.triangleMeshes, ...this.diamondMeshes]
        .filter((m) => m.points.valid)
        .find((m) =>
          this.cursor != null
            ? testMesh(m, currentFrame, this.viewport, this.cursor)
            : false
        );

      if (this.hoveredMesh !== previousHovered) {
        this.hoveredChanged.emit(this.hoveredMesh);
        this.hoveredMesh?.updateFillColor(this.hoveredArrowFillColor);
        previousHovered?.updateFillColor(previousHovered?.initialFillColor);
      }
    }
  }

  private clearHovered(): void {
    const previousHovered = this.hoveredMesh;
    this.hoveredMesh = undefined;

    if (this.hoveredMesh !== previousHovered) {
      this.hoveredChanged.emit(this.hoveredMesh);
      previousHovered.updateFillColor(previousHovered.initialFillColor);
    }
  }

  private sortMeshes(frame: Frame, ...meshes: Mesh[]): void {
    const compare = (m1: Mesh, m2: Mesh): number =>
      m1.points.shortestDistanceFrom(frame.scene.camera.position) -
      m2.points.shortestDistanceFrom(frame.scene.camera.position);

    this.axisMeshes = this.axisMeshes.sort(compare);
    this.triangleMeshes = this.triangleMeshes.sort(compare);
    this.diamondMeshes = this.diamondMeshes.sort(compare);

    // Reverse sorted meshes to draw the closest mesh last.
    // This causes it to appear above any other mesh.
    this.drawableMeshes = meshes
      .filter((m) => m.points.valid)
      .sort(compare)
      .reverse();
  }

  private createOrUpdateMeshes(transform: Matrix4.Matrix4, frame: Frame): void {
    if (this.xArrow == null || this.yArrow == null || this.zArrow == null) {
      this.createMeshes(transform, frame);
    } else {
      this.updateMeshes(transform, frame);
    }

    this.bounds = computeMesh2dBounds(this.viewport, ...this.triangleMeshes);
  }

  private createMeshes(transform: Matrix4.Matrix4, frame: Frame): void {
    this.reglCommand = regl({
      canvas: this.canvasElement,
      extensions: ['ANGLE_instanced_arrays'],
    });
    const { createShape } = shapeBuilder(this.reglCommand);

    const triangleSize = this.computeTriangleSize(transform, frame);

    this.xArrow = new TriangleMesh(
      createShape,
      'x-translate',
      xAxisArrowPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.xArrowFillColor
    );
    this.xRotation = new DiamondMesh(
      createShape,
      'x-rotate',
      xAxisRotationPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.xArrowFillColor
    );
    this.xAxis = new AxisMesh(
      createShape,
      'x-axis',
      axisPositions(transform, frame.scene.camera, this.xArrow),
      this.outlineColor,
      this.xArrowFillColor,
      { thickness: 3 }
    );
    this.yArrow = new TriangleMesh(
      createShape,
      'y-translate',
      yAxisArrowPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.yArrowFillColor
    );
    this.yRotation = new DiamondMesh(
      createShape,
      'y-rotate',
      yAxisRotationPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.yArrowFillColor
    );
    this.yAxis = new AxisMesh(
      createShape,
      'y-axis',
      axisPositions(transform, frame.scene.camera, this.yArrow),
      this.outlineColor,
      this.yArrowFillColor,
      { thickness: 3 }
    );
    this.zArrow = new TriangleMesh(
      createShape,
      'z-translate',
      zAxisArrowPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.zArrowFillColor
    );
    this.zAxis = new AxisMesh(
      createShape,
      'z-axis',
      axisPositions(transform, frame.scene.camera, this.zArrow),
      this.outlineColor,
      this.zArrowFillColor,
      { thickness: 3 }
    );
    this.zRotation = new DiamondMesh(
      createShape,
      'z-rotate',
      zAxisRotationPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.zArrowFillColor
    );

    this.axisMeshes = [this.xAxis, this.yAxis, this.zAxis];
    this.triangleMeshes = [this.xArrow, this.yArrow, this.zArrow];
    this.diamondMeshes = [this.xRotation, this.yRotation, this.zRotation];
  }

  private updateMeshes(transform: Matrix4.Matrix4, frame: Frame): void {
    const triangleSize = this.computeTriangleSize(transform, frame);

    if (this.xArrow != null) {
      this.xArrow.updatePoints(
        xAxisArrowPositions(transform, frame.scene.camera, triangleSize)
      );
      this.xAxis?.updatePoints(
        axisPositions(transform, frame.scene.camera, this.xArrow)
      );
    }
    this.xRotation?.updatePoints(
      xAxisRotationPositions(transform, frame.scene.camera, triangleSize)
    );

    if (this.yArrow != null) {
      this.yArrow.updatePoints(
        yAxisArrowPositions(transform, frame.scene.camera, triangleSize)
      );
      this.yAxis?.updatePoints(
        axisPositions(transform, frame.scene.camera, this.yArrow)
      );
    }
    this.yRotation?.updatePoints(
      yAxisRotationPositions(transform, frame.scene.camera, triangleSize)
    );

    if (this.zArrow != null) {
      this.zArrow.updatePoints(
        zAxisArrowPositions(transform, frame.scene.camera, triangleSize)
      );
      this.zAxis?.updatePoints(
        axisPositions(transform, frame.scene.camera, this.zArrow)
      );
    }
    this.zRotation?.updatePoints(
      zAxisRotationPositions(transform, frame.scene.camera, triangleSize)
    );
  }

  private computeTriangleSize(
    transform: Matrix4.Matrix4,
    frame: Frame
  ): number {
    const position = Vector3.fromMatrixPosition(transform);

    return (
      (frame.scene.camera.isOrthographic()
        ? frame.scene.camera.fovHeight
        : Vector3.magnitude(
            Vector3.subtract(position, frame.scene.camera.position)
          )) * DEFAULT_MESH_SCALAR
    );
  }
}
