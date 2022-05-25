import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import { JoinStyle, ShapeProps } from 'regl-shape';

import { CreateShape, DrawShape } from '../../lib/transforms/shape';
import { Viewport } from '../types';
import { flattenPointArray } from './util';

export interface MeshPoints {
  valid: boolean;

  shortestDistanceFrom(vector: Vector3.Vector3): number;

  toWorldArray(): Vector3.Vector3[];
  toArray(): Point.Point[];
}

export abstract class Mesh<T extends MeshPoints = MeshPoints> {
  protected pointsArray: Float64Array;

  public initialFillColor?: string;

  public draw: DrawShape;

  public constructor(
    protected createShape: CreateShape,
    public identifier: string,
    public points: T,
    public outlineColor: string,
    public fillColor?: string,
    public shapeProps: Partial<ShapeProps> = {}
  ) {
    const pointsAsArray = points.toArray();

    this.pointsArray = new Float64Array(pointsAsArray.length * 2);
    flattenPointArray(pointsAsArray).forEach(
      (v, i) => (this.pointsArray[i] = v)
    );

    this.initialFillColor = fillColor;

    this.draw = createShape(this.pointsArray, {
      count: pointsAsArray.length,
      thickness: 2,
      join: 'rect' as JoinStyle,
      fill: this.fillColor,
      color: this.outlineColor,
      ...shapeProps,
    });
  }

  public updateFillColor(color?: Color.Color | string): void {
    if (color != null) {
      this.fillColor =
        typeof color === 'string' ? color : Color.toHexString(color);
    }
  }

  public updatePoints(points: T): void {
    this.points = points;
    flattenPointArray(points.toArray()).forEach(
      (v, i) => (this.pointsArray[i] = v)
    );
  }
}

export class AxisMeshPoints implements MeshPoints {
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

export class AxisMesh extends Mesh<AxisMeshPoints> {
  public constructor(
    createShape: CreateShape,
    identifier: string,
    points: AxisMeshPoints,
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
}

export class TriangleMeshPoints implements MeshPoints {
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

export class TriangleMesh extends Mesh<TriangleMeshPoints> {
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
}

export class DiamondMeshPoints implements MeshPoints {
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

export class DiamondMesh extends Mesh<DiamondMeshPoints> {
  public constructor(
    createShape: CreateShape,
    identifier: string,
    points: DiamondMeshPoints,
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
}

export function computeMesh2dBounds(
  viewport: Viewport,
  ...meshes: Mesh[]
): Rectangle.Rectangle {
  let min = Point.create(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  let max = Point.create();

  meshes
    .filter((m) => m.points.valid)
    .map((m) => {
      m.points
        .toArray()
        .map((pt) => viewport.transformNdcPointToViewport(pt))
        .forEach((pt) => {
          min = Point.create(Math.min(pt.x, min.x), Math.min(pt.y, min.y));
          max = Point.create(Math.max(pt.x, max.x), Math.max(pt.y, max.y));
        });
    });

  return Rectangle.fromPoints(min, max);
}
