import { Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import { ShapeProps } from 'regl-shape';

import { CreateShape } from '../../lib/transforms/shape';
import { Drawable, DrawablePoints } from './drawable';

export class TriangleMeshPoints implements DrawablePoints {
  public constructor(
    public valid: boolean,
    public worldBase: Vector3.Vector3,
    public worldLeft: Vector3.Vector3,
    public worldRight: Vector3.Vector3,
    public worldTip: Vector3.Vector3,
    public base: Point.Point,
    public left: Point.Point,
    public right: Point.Point,
    public tip: Point.Point
  ) {}

  public shortestDistanceFrom(vector: Vector3.Vector3): number {
    return this.toWorldArray()
      .map((v) => Vector3.distance(v, vector))
      .sort((a, b) => a - b)[0];
  }

  public toWorldArray(): Vector3.Vector3[] {
    return [this.worldBase, this.worldLeft, this.worldRight, this.worldTip];
  }

  public toArray(): Point.Point[] {
    return [this.base, this.left, this.tip, this.right, this.base];
  }
}

export class TriangleMesh extends Drawable<TriangleMeshPoints> {
  public constructor(
    createShape: CreateShape,
    identifier: string,
    points: TriangleMeshPoints,
    outlineColor: Color.Color | string = '#000000',
    fillColor: Color.Color | string = '#000000',
    shapeProps: Partial<ShapeProps> = {}
  ) {
    super(
      createShape,
      identifier,
      points,
      typeof outlineColor === 'string'
        ? outlineColor
        : Color.toHexString(outlineColor),
      typeof fillColor === 'string' ? fillColor : Color.toHexString(fillColor),
      shapeProps
    );
  }

  public setDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }
}
