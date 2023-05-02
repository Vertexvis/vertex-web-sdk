import { Point, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import { JoinStyle, ShapeProps } from 'regl-shape';

import { CreateShape } from '../../lib/transforms/shape';
import { Drawable, DrawablePoints } from './drawable';

export class AxisLinePoints implements DrawablePoints {
  public constructor(
    public valid: boolean,
    public worldOrigin: Vector3.Vector3,
    public worldEnd: Vector3.Vector3,
    public origin: Point.Point,
    public end: Point.Point
  ) {}

  public shortestDistanceFrom(vector: Vector3.Vector3): number {
    return this.toWorldArray()
      .map((v) => Vector3.distance(v, vector))
      .sort((a, b) => a - b)[0];
  }

  public toWorldArray(): Vector3.Vector3[] {
    return [this.worldOrigin, this.worldEnd];
  }

  public toArray(): Point.Point[] {
    return [this.origin, this.end];
  }
}

export class AxisLine extends Drawable<AxisLinePoints> {
  public constructor(
    createShape: CreateShape,
    identifier: string,
    points: AxisLinePoints,
    outlineColor: Color.Color | string = '#000000',
    fillColor: Color.Color | string = '#000000',
    shapeProps: Partial<ShapeProps> = { thickness: 3 }
  ) {
    super(
      createShape,
      identifier,
      points,
      typeof outlineColor === 'string'
        ? outlineColor
        : Color.toHexString(outlineColor),
      typeof fillColor === 'string' ? fillColor : Color.toHexString(fillColor),
      undefined,
      shapeProps
    );
  }
}

export class RotationLinePoints implements DrawablePoints {
  public constructor(
    public valid: boolean,
    public world: Vector3.Vector3[],
    public ndc: Vector3.Vector3[]
  ) {}

  public shortestDistanceFrom(vector: Vector3.Vector3): number {
    return this.toWorldArray()
      .map((v) => Vector3.distance(v, vector))
      .sort((a, b) => a - b)[0];
  }

  public toWorldArray(): Vector3.Vector3[] {
    return this.world;
  }

  public toArray(): Point.Point[] {
    return this.ndc;
  }
}

export class RotationLine extends Drawable<RotationLinePoints> {
  public constructor(
    createShape: CreateShape,
    identifier: string,
    points: RotationLinePoints,
    outlineColor: Color.Color | string = '#000000',
    shapeProps: Partial<ShapeProps> = {
      join: 'round' as JoinStyle,
    }
  ) {
    super(
      createShape,
      identifier,
      points,
      typeof outlineColor === 'string'
        ? outlineColor
        : Color.toHexString(outlineColor),
      undefined,
      undefined,
      shapeProps
    );
  }
}
