import { Matrix4 } from '@vertexvis/geometry';
import { Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import regl from 'regl';
import shapeBuilder, { JoinStyle } from 'regl-shape';

import { axisPositions } from '../../../lib/transforms/axis-lines';
import { computeArrowNdcValues } from '../../../lib/transforms/axis-translation';
import { AxisLine } from '../../../lib/transforms/line';
import { Mesh, TriangleMesh } from '../../../lib/transforms/mesh';
import { Frame } from '../../../lib/types';
import { ReglComponent } from '../../../lib/webgl/regl-component';
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

// The default amount to scale the computed `triangleSize` by when
// computing the points for the hit position indicator.
export const DEFAULT_POINT_SIZE_SCALAR = 0.4;

// The default amount to scale the computed `triangleSize` by when
// computing the points for the hit plane indicator.
export const DEFAULT_PLANE_SIZE_SCALAR = 5;

export const DEFAULT_PLANE_OPACITY = 0.75;

export class HitIndicator extends ReglComponent {
  private axis?: AxisLine;
  private arrow?: TriangleMesh;
  private point?: Mesh;
  private plane?: Mesh;

  private transform?: Matrix4.Matrix4;
  private normal?: Vector3.Vector3;

  private arrowFillColor?: Color.Color | string;
  private planeFillColor?: Color.Color | string;
  private outlineColor?: Color.Color | string;

  private planeOpacity?: string | number;

  public constructor(
    canvasElement: HTMLCanvasElement,
    colors: DrawableElementColors = {},
    opacities: DrawableElementOpacities = {}
  ) {
    super(canvasElement);

    this.arrowFillColor = colors.arrow;
    this.planeFillColor = colors.plane;
    this.outlineColor = colors.outline;
    this.planeOpacity = opacities.plane;
  }

  public updateTransformAndNormal(
    transform?: Matrix4.Matrix4,
    normal?: Vector3.Vector3
  ): void {
    this.transform = transform;
    this.normal = normal;

    if (transform != null && normal != null && this.frame != null) {
      this.updateAndDraw();
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

  protected hasData(): boolean {
    return this.transform != null && this.normal != null;
  }

  protected createOrUpdateElements(): void {
    if (this.transform != null && this.normal != null && this.frame != null) {
      if (this.arrow == null) {
        this.createElements(this.transform, this.normal, this.frame);
      } else {
        this.updateElements(this.transform, this.normal, this.frame);
      }
    }
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

    const triangleSize = this.computeTriangleSize(
      Vector3.fromMatrixPosition(transform),
      frame
    );

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
        triangleSize * DEFAULT_PLANE_SIZE_SCALAR
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
        triangleSize * DEFAULT_POINT_SIZE_SCALAR
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

    this.availableElements = [this.arrow, this.point, this.plane, this.axis];
  }

  private updateElements(
    transform: Matrix4.Matrix4,
    normal: Vector3.Vector3,
    frame: Frame
  ): void {
    const triangleSize = this.computeTriangleSize(
      Vector3.fromMatrixPosition(transform),
      frame
    );

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
          triangleSize * DEFAULT_PLANE_SIZE_SCALAR
        )
      );
    }
    if (this.point != null) {
      this.point.updatePoints(
        computePointNdcValues(
          transform,
          frame.scene.camera,
          normal,
          triangleSize * DEFAULT_POINT_SIZE_SCALAR
        )
      );
    }
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
