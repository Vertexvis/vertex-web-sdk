import { Matrix4 } from '@vertexvis/geometry';
import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { Color, Disposable, EventDispatcher, Listener } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import {
  axisPositions,
  rotationAxisPositions,
} from '../../lib/transforms/axis-lines';
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
import {
  computeDrawable2dBounds,
  Drawable,
} from '../../lib/transforms/drawable';
import { testDrawable } from '../../lib/transforms/hits';
import { AxisLine, RotationLine } from '../../lib/transforms/line';
import { TriangleMesh } from '../../lib/transforms/mesh';
import { CreateShape } from '../../lib/transforms/shape';
import { Frame, Viewport } from '../../lib/types';

export interface MeshColors {
  xArrow?: Color.Color | string;
  yArrow?: Color.Color | string;
  zArrow?: Color.Color | string;
  hovered?: Color.Color | string;
  outline?: Color.Color | string;
}

// Scalar that is used in combination with a perspective camera's
// components to determine the relative size of the meshes.
// This attempts to keep the widget approximately the same
// size as zooming occurs.
export const DEFAULT_PERSPECTIVE_MESH_SCALAR = 0.005;

// Scalar that is used in combination with an orthographic camera's
// components to determine the relative size of the meshes.
// This attempts to keep the widget approximately the same
// size as zooming occurs.
export const DEFAULT_ORTHOGRAPHIC_MESH_SCALAR = 0.00625;

export class TransformWidget implements Disposable {
  private reglCommand?: regl.Regl;

  private viewport: Viewport;
  private cursor?: Point.Point;

  private xAxis?: AxisLine;
  private yAxis?: AxisLine;
  private zAxis?: AxisLine;
  private xArrow?: TriangleMesh;
  private yArrow?: TriangleMesh;
  private zArrow?: TriangleMesh;
  private xRotation?: TriangleMesh;
  private xyRotationLine?: RotationLine;
  private xzRotationLine?: RotationLine;
  private yRotation?: TriangleMesh;
  private yxRotationLine?: RotationLine;
  private yzRotationLine?: RotationLine;
  private zRotation?: TriangleMesh;
  private zxRotationLine?: RotationLine;
  private zyRotationLine?: RotationLine;

  private axisLines: AxisLine[] = [];
  private rotationLines: RotationLine[] = [];
  private translationMeshes: TriangleMesh[] = [];
  private rotationMeshes: TriangleMesh[] = [];
  private drawableElements: Drawable[] = [];
  private hoveredElement?: Drawable;

  private frame?: Frame;
  private transform?: Matrix4.Matrix4;
  private bounds?: Rectangle.Rectangle;

  private reglFrameDisposable?: regl.Cancellable;

  private hoveredChanged = new EventDispatcher<Drawable | undefined>();

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
  public getDrawableElements(): Drawable[] {
    return this.drawableElements;
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
        ...this.axisLines,
        ...this.rotationLines,
        ...this.translationMeshes,
        ...this.rotationMeshes
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
        ...this.axisLines,
        ...this.rotationLines,
        ...this.translationMeshes,
        ...this.rotationMeshes
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
    this.xRotation?.updateFillColor(this.xArrowFillColor);
    this.yRotation?.updateFillColor(this.yArrowFillColor);
    this.zRotation?.updateFillColor(this.zArrowFillColor);
    this.hoveredElement?.updateFillColor(this.hoveredArrowFillColor);
  }

  public updateDimensions(canvasElement: HTMLCanvasElement): void {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);

    if (this.transform != null && this.frame != null) {
      this.createOrUpdateMeshes(this.transform, this.frame);
    }
  }

  public onHoveredChanged(
    listener: Listener<Drawable | undefined>
  ): Disposable {
    return this.hoveredChanged.on(listener);
  }

  private draw(): void {
    if (this.reglFrameDisposable == null) {
      this.reglFrameDisposable = this.reglCommand?.frame(() => {
        this.drawableElements.forEach((el) => el.draw({ fill: el.fillColor }));
      });
    }
  }

  private clear(): void {
    this.reglCommand?.clear({
      color: [0, 0, 0, 0],
    });
  }

  private updateHovered(): void {
    const previousHovered = this.hoveredElement;
    const currentFrame = this.frame;

    if (currentFrame != null) {
      this.hoveredElement = [...this.translationMeshes, ...this.rotationMeshes]
        .filter((el) => el.points.valid)
        .find((m) =>
          this.cursor != null
            ? testDrawable(m, currentFrame, this.viewport, this.cursor)
            : false
        );

      if (this.hoveredElement !== previousHovered) {
        this.hoveredChanged.emit(this.hoveredElement);
        this.hoveredElement?.updateFillColor(this.hoveredArrowFillColor);
        previousHovered?.updateFillColor(previousHovered?.initialFillColor);
      }
    }
  }

  private clearHovered(): void {
    const previousHovered = this.hoveredElement;
    this.hoveredElement = undefined;

    if (this.hoveredElement !== previousHovered) {
      this.hoveredChanged.emit(this.hoveredElement);
      previousHovered.updateFillColor(previousHovered.initialFillColor);
    }
  }

  private sortMeshes(frame: Frame, ...meshes: Drawable[]): void {
    const compare = (d1: Drawable, d2: Drawable): number =>
      d1.points.shortestDistanceFrom(frame.scene.camera.position) -
      d2.points.shortestDistanceFrom(frame.scene.camera.position);

    this.axisLines = this.axisLines.sort(compare);
    this.translationMeshes = this.translationMeshes.sort(compare);
    this.rotationMeshes = this.rotationMeshes.sort(compare);

    // Reverse sorted meshes to draw the closest mesh last.
    // This causes it to appear above any other mesh.
    this.drawableElements = meshes
      .filter((el) => el.points.valid)
      .sort(compare)
      .reverse();
  }

  private createOrUpdateMeshes(transform: Matrix4.Matrix4, frame: Frame): void {
    if (this.xArrow == null || this.yArrow == null || this.zArrow == null) {
      this.createMeshes(transform, frame);
    } else {
      this.updateMeshes(transform, frame);
    }

    this.bounds = computeDrawable2dBounds(
      this.viewport,
      ...this.rotationMeshes,
      ...this.translationMeshes
    );
  }

  private createMeshes(transform: Matrix4.Matrix4, frame: Frame): void {
    this.reglCommand = regl({
      canvas: this.canvasElement,
      extensions: 'angle_instanced_arrays',
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
    this.xRotation = new TriangleMesh(
      createShape,
      'x-rotate',
      xAxisRotationPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.xArrowFillColor
    );
    this.xAxis = new AxisLine(
      createShape,
      'x-axis',
      axisPositions(transform, frame.scene.camera, this.xArrow),
      this.outlineColor,
      this.xArrowFillColor
    );
    this.yArrow = new TriangleMesh(
      createShape,
      'y-translate',
      yAxisArrowPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.yArrowFillColor
    );
    this.yRotation = new TriangleMesh(
      createShape,
      'y-rotate',
      yAxisRotationPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.yArrowFillColor
    );
    this.yAxis = new AxisLine(
      createShape,
      'y-axis',
      axisPositions(transform, frame.scene.camera, this.yArrow),
      this.outlineColor,
      this.yArrowFillColor
    );
    this.zArrow = new TriangleMesh(
      createShape,
      'z-translate',
      zAxisArrowPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.zArrowFillColor
    );
    this.zAxis = new AxisLine(
      createShape,
      'z-axis',
      axisPositions(transform, frame.scene.camera, this.zArrow),
      this.outlineColor,
      this.zArrowFillColor
    );
    this.zRotation = new TriangleMesh(
      createShape,
      'z-rotate',
      zAxisRotationPositions(transform, frame.scene.camera, triangleSize),
      this.outlineColor,
      this.zArrowFillColor
    );

    this.createRotationLines(createShape, transform, frame);

    this.axisLines = [this.xAxis, this.yAxis, this.zAxis];
    this.translationMeshes = [this.xArrow, this.yArrow, this.zArrow];
    this.rotationMeshes = [this.xRotation, this.yRotation, this.zRotation];
  }

  private createRotationLines(
    createShape: CreateShape,
    transform: Matrix4.Matrix4,
    frame: Frame
  ): void {
    const triangleSize = this.computeTriangleSize(transform, frame);

    const xyRotationLinePoints = rotationAxisPositions(
      frame.scene.camera,
      this.xRotation,
      this.yArrow?.points.worldTip,
      triangleSize
    );
    const xzRotationLinePoints = rotationAxisPositions(
      frame.scene.camera,
      this.xRotation,
      this.zArrow?.points.worldTip,
      triangleSize
    );
    const yxRotationLinePoints = rotationAxisPositions(
      frame.scene.camera,
      this.yRotation,
      this.xArrow?.points.worldTip,
      triangleSize
    );
    const yzRotationLinePoints = rotationAxisPositions(
      frame.scene.camera,
      this.yRotation,
      this.zArrow?.points.worldTip,
      triangleSize
    );
    const zxRotationLinePoints = rotationAxisPositions(
      frame.scene.camera,
      this.zRotation,
      this.xArrow?.points.worldTip,
      triangleSize
    );
    const zyRotationLinePoints = rotationAxisPositions(
      frame.scene.camera,
      this.zRotation,
      this.yArrow?.points.worldTip,
      triangleSize
    );

    if (xyRotationLinePoints != null) {
      this.xyRotationLine = new RotationLine(
        createShape,
        'xy-rotation-line',
        xyRotationLinePoints,
        this.outlineColor
      );
    }
    if (xzRotationLinePoints != null) {
      this.xzRotationLine = new RotationLine(
        createShape,
        'xz-rotation-line',
        xzRotationLinePoints,
        this.outlineColor
      );
    }
    if (yxRotationLinePoints != null) {
      this.yxRotationLine = new RotationLine(
        createShape,
        'yx-rotation-line',
        yxRotationLinePoints,
        this.outlineColor
      );
    }
    if (yzRotationLinePoints != null) {
      this.yzRotationLine = new RotationLine(
        createShape,
        'yz-rotation-line',
        yzRotationLinePoints,
        this.outlineColor
      );
    }
    if (zxRotationLinePoints != null) {
      this.zxRotationLine = new RotationLine(
        createShape,
        'zx-rotation-line',
        zxRotationLinePoints,
        this.outlineColor
      );
    }
    if (zyRotationLinePoints != null) {
      this.zyRotationLine = new RotationLine(
        createShape,
        'zy-rotation-line',
        zyRotationLinePoints,
        this.outlineColor
      );
    }

    this.rotationLines = [
      this.xyRotationLine,
      this.xzRotationLine,
      this.yxRotationLine,
      this.yzRotationLine,
      this.zxRotationLine,
      this.zyRotationLine,
    ].filter((l) => l != null) as RotationLine[];
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

    this.xyRotationLine?.updatePoints(
      rotationAxisPositions(
        frame.scene.camera,
        this.xRotation,
        this.yArrow?.points.worldTip,
        triangleSize
      )
    );
    this.xzRotationLine?.updatePoints(
      rotationAxisPositions(
        frame.scene.camera,
        this.xRotation,
        this.zArrow?.points.worldTip,
        triangleSize
      )
    );
    this.yxRotationLine?.updatePoints(
      rotationAxisPositions(
        frame.scene.camera,
        this.yRotation,
        this.xArrow?.points.worldTip,
        triangleSize
      )
    );
    this.yzRotationLine?.updatePoints(
      rotationAxisPositions(
        frame.scene.camera,
        this.yRotation,
        this.zArrow?.points.worldTip,
        triangleSize
      )
    );
    this.zxRotationLine?.updatePoints(
      rotationAxisPositions(
        frame.scene.camera,
        this.zRotation,
        this.xArrow?.points.worldTip,
        triangleSize
      )
    );
    this.zyRotationLine?.updatePoints(
      rotationAxisPositions(
        frame.scene.camera,
        this.zRotation,
        this.yArrow?.points.worldTip,
        triangleSize
      )
    );
  }

  private computeTriangleSize(
    transform: Matrix4.Matrix4,
    frame: Frame
  ): number {
    const position = Vector3.fromMatrixPosition(transform);

    return frame.scene.camera.isOrthographic()
      ? frame.scene.camera.fovHeight * DEFAULT_ORTHOGRAPHIC_MESH_SCALAR
      : Vector3.magnitude(
          Vector3.subtract(position, frame.scene.camera.position)
        ) * DEFAULT_PERSPECTIVE_MESH_SCALAR;
  }
}
