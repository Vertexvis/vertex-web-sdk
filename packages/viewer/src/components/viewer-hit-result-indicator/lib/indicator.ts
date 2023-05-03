import { Matrix4 } from '@vertexvis/geometry';
import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { Color, Disposable, EventDispatcher, Listener } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder, { JoinStyle } from 'regl-shape';

import { axisPositions } from '../../../lib/transforms/axis-lines';
import { computeArrowNdcValues } from '../../../lib/transforms/axis-translation';
import { Drawable } from '../../../lib/transforms/drawable';
import { AxisLine } from '../../../lib/transforms/line';
import { Mesh, TriangleMesh } from '../../../lib/transforms/mesh';
import { Frame } from '../../../lib/types';
import { computePlaneNdcValues } from './plane';
import { computePointNdcValues } from './point';

export interface DrawableElementColors {
  arrow?: Color.Color | string;
  plane?: Color.Color | string;
  outline?: Color.Color | string;
}

export interface DrawableElementOpacities {
  plane?: string | number;
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

export const DEFAULT_PLANE_OPACITY = 0.75;

export class HitIndicator implements Disposable {
  private reglCommand?: regl.Regl;

  private axis?: AxisLine;
  private arrow?: TriangleMesh;
  private point?: Mesh;
  private plane?: Mesh;

  private drawableElements: Drawable[] = [];

  private frame?: Frame;
  private transform?: Matrix4.Matrix4;
  private normal?: Vector3.Vector3;
  private bounds?: Rectangle.Rectangle;

  private reglFrameDisposable?: regl.Cancellable;

  private hoveredChanged = new EventDispatcher<Drawable | undefined>();

  private arrowFillColor?: Color.Color | string;
  private planeFillColor?: Color.Color | string;
  private outlineColor?: Color.Color | string;

  private planeOpacity?: string | number;

  public constructor(
    private canvasElement: HTMLCanvasElement,
    colors: DrawableElementColors = {},
    opacities: DrawableElementOpacities = {}
  ) {
    this.arrowFillColor = colors.arrow;
    this.planeFillColor = colors.plane;
    this.outlineColor = colors.outline;
    this.planeOpacity = opacities.plane;
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

  public updateFrame(frame: Frame): void {
    this.frame = frame;

    if (frame != null && this.transform != null && this.normal != null) {
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
    this.outlineColor = colors.outline ?? this.outlineColor;
    this.arrow?.updateFillColor(this.arrowFillColor);
    this.plane?.updateFillColor(this.planeFillColor);
    this.arrow?.updateOutlineColor(this.outlineColor);
    this.plane?.updateOutlineColor(this.outlineColor);
    this.point?.updateOutlineColor(this.outlineColor);
    this.axis?.updateOutlineColor(this.outlineColor);
  }

  public updateOpacities(opacities: DrawableElementOpacities): void {
    this.planeOpacity = opacities.plane;
  }

  public updateDimensions(): void {
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
      this.outlineColor,
      this.arrowFillColor
    );
    this.plane = new Mesh(
      createShape,
      'hit-plane',
      computePlaneNdcValues(
        transform,
        frame.scene.camera,
        normal,
        triangleSize
      ),
      this.outlineColor,
      this.planeFillColor,
      {
        opacity: this.getPlaneOpacity(),
        depth: 0.5,
      }
    );
    this.point = new Mesh(
      createShape,
      'hit-position',
      computePointNdcValues(
        transform,
        frame.scene.camera,
        normal,
        triangleSize
      ),
      this.outlineColor,
      this.outlineColor,
      {
        join: 'round' as JoinStyle,
        depth: 1,
      }
    );
    this.axis = new AxisLine(
      createShape,
      'hit-normal-axis',
      axisPositions(transform, frame.scene.camera, this.arrow),
      this.outlineColor,
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
        computePlaneNdcValues(
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

  private getPlaneOpacity(): number {
    if (this.planeOpacity != null) {
      return typeof this.planeOpacity === 'string'
        ? parseFloat(this.planeOpacity)
        : this.planeOpacity;
    }
    return DEFAULT_PLANE_OPACITY;
  }
}
