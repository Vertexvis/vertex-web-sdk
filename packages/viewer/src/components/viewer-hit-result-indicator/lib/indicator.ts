import { Matrix4 } from '@vertexvis/geometry';
import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { Color, Disposable, EventDispatcher, Listener } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder, { JoinStyle } from 'regl-shape';

import { axisPositions } from '../../../lib/transforms/axis-lines';
import { computeArrowNdcValues } from '../../../lib/transforms/axis-translation';
import { Drawable } from '../../../lib/transforms/drawable';
import { AxisLine } from '../../../lib/transforms/line';
import {
  Mesh,
  RectangleMesh,
  TriangleMesh,
} from '../../../lib/transforms/mesh';
import { computePointNdcValues } from '../../../lib/transforms/point';
import { computeRectangleNdcValues } from '../../../lib/transforms/rectangle';
import { Frame, Viewport } from '../../../lib/types';

export interface DrawableElementColors {
  arrow?: Color.Color | string;
  plane?: Color.Color | string;
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

export const MAX_PERSPECTIVE_TRIANGLE_SIZE = 100;
export const MAX_ORTHOGRAPHIC_TRIANGLE_SIZE = 100;

export class HitIndicator implements Disposable {
  private reglCommand?: regl.Regl;

  private viewport: Viewport;

  private axis?: AxisLine;
  private arrow?: TriangleMesh;
  private point?: Mesh;
  private plane?: RectangleMesh;

  private drawableElements: Drawable[] = [];

  private frame?: Frame;
  private transform?: Matrix4.Matrix4;
  private normal?: Vector3.Vector3;
  private bounds?: Rectangle.Rectangle;

  private reglFrameDisposable?: regl.Cancellable;

  private hoveredChanged = new EventDispatcher<Drawable | undefined>();

  private arrowFillColor?: Color.Color | string;
  private planeFillColor?: Color.Color | string;

  public constructor(
    private canvasElement: HTMLCanvasElement,
    colors: DrawableElementColors = {}
  ) {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);

    this.arrowFillColor = colors.arrow;
    this.planeFillColor = colors.plane;
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

  public updateFrame(frame: Frame, updateElements = true): void {
    this.frame = frame;

    if (
      updateElements &&
      frame != null &&
      this.transform != null &&
      this.normal != null
    ) {
      this.createOrUpdateElements(this.transform, this.normal, frame);
      this.sortMeshes(frame, this.arrow, this.point, this.plane, this.axis);
      this.draw();
    }
  }

  public updateTransformAndNormal(
    transform?: Matrix4.Matrix4,
    normal?: Vector3.Vector3
  ): void {
    this.transform = transform;
    this.normal = normal;

    if (transform != null && normal != null && this.frame != null) {
      this.createOrUpdateElements(transform, normal, this.frame);
      this.sortMeshes(
        this.frame,
        this.arrow,
        this.point,
        this.plane,
        this.axis
      );
      this.draw();
    } else {
      this.clear();
      this.reglFrameDisposable?.cancel();
      this.reglFrameDisposable = undefined;
    }
  }

  public updateColors(colors: DrawableElementColors): void {
    this.arrowFillColor = colors.arrow ?? this.arrowFillColor;
    this.planeFillColor = colors.plane ?? this.planeFillColor;
    this.arrow?.updateFillColor(this.arrowFillColor);
    this.plane?.updateFillColor(this.planeFillColor);
  }

  public updateDimensions(canvasElement: HTMLCanvasElement): void {
    this.viewport = new Viewport(canvasElement.width, canvasElement.height);

    if (this.transform != null && this.normal != null && this.frame != null) {
      this.createOrUpdateElements(this.transform, this.normal, this.frame);
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
        this.drawableElements.forEach((el) => el?.draw({ fill: el.fillColor }));
      });
    }
  }

  private clear(): void {
    this.reglCommand?.clear({
      color: [0, 0, 0, 0],
    });
  }

  private createOrUpdateElements(
    transform: Matrix4.Matrix4,
    normal: Vector3.Vector3,
    frame: Frame
  ): void {
    if (this.arrow == null) {
      this.createElements(transform, normal, frame);
    } else {
      this.updateElements(transform, normal, frame);
    }
  }

  private sortMeshes(
    frame: Frame,
    ...drawableElements: Array<Drawable | undefined>
  ): void {
    const compare = (d1: Drawable, d2: Drawable): number =>
      d1.points.shortestDistanceFrom(frame.scene.camera.position) -
      d2.points.shortestDistanceFrom(frame.scene.camera.position);

    // Reverse sorted elements to draw the closest element last.
    // This causes it to appear above any other element.
    this.drawableElements = (
      drawableElements.filter((el) => el != null) as Drawable[]
    )
      .filter((el) => el.points.valid)
      .sort(compare)
      .reverse();
  }

  private createElements(
    transform: Matrix4.Matrix4,
    normal: Vector3.Vector3,
    frame: Frame
  ): void {
    this.reglCommand = regl({
      canvas: this.canvasElement,
      extensions: 'angle_instanced_arrays',
    });
    const { createShape } = shapeBuilder(this.reglCommand);

    const triangleSize = this.computeTriangleSize(transform, frame);

    this.arrow = new TriangleMesh(
      createShape,
      'hit-normal-arrow',
      computeArrowNdcValues(
        transform,
        frame.scene.camera,
        normal,
        triangleSize
      ),
      // this.outlineColor,
      '#000000',
      this.arrowFillColor
    );
    this.plane = new RectangleMesh(
      createShape,
      'hit-plane',
      computeRectangleNdcValues(
        transform,
        frame.scene.camera,
        normal,
        triangleSize
      ),
      '#000000',
      this.planeFillColor,
      {
        opacity: 0.75,
      }
    );
    this.point = new Mesh(
      createShape,
      'hit-plane',
      computePointNdcValues(
        transform,
        frame.scene.camera,
        normal,
        triangleSize
      ),
      '#000000',
      '#000000',
      {
        join: 'round' as JoinStyle,
      }
    );
    this.axis = new AxisLine(
      createShape,
      'hit-normal-axis',
      axisPositions(transform, frame.scene.camera, this.arrow),
      // this.outlineColor,
      '#000000',
      this.arrowFillColor
    );
  }

  private updateElements(
    transform: Matrix4.Matrix4,
    normal: Vector3.Vector3,
    frame: Frame
  ): void {
    const triangleSize = this.computeTriangleSize(transform, frame);

    if (this.arrow != null) {
      this.arrow.updatePoints(
        computeArrowNdcValues(
          transform,
          frame.scene.camera,
          normal,
          triangleSize
        )
      );
      this.axis?.updatePoints(
        axisPositions(transform, frame.scene.camera, this.arrow)
      );
    }
    if (this.plane != null) {
      this.plane.updatePoints(
        computeRectangleNdcValues(
          transform,
          frame.scene.camera,
          normal,
          triangleSize
        )
      );
    }
    if (this.point != null) {
      this.point.updatePoints(
        computePointNdcValues(
          transform,
          frame.scene.camera,
          normal,
          triangleSize
        )
      );
    }
  }

  private computeTriangleSize(
    transform: Matrix4.Matrix4,
    frame: Frame
  ): number {
    const position = Vector3.fromMatrixPosition(transform);

    const size = frame.scene.camera.isOrthographic()
      ? frame.scene.camera.fovHeight * DEFAULT_ORTHOGRAPHIC_MESH_SCALAR
      : Vector3.magnitude(
          Vector3.subtract(position, frame.scene.camera.position)
        ) * DEFAULT_PERSPECTIVE_MESH_SCALAR;

    return size;
  }
}
