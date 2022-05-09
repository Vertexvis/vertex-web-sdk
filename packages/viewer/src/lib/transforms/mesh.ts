import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { ShapeProps } from 'regl-shape';

export abstract class Mesh {
  protected pointsArray: Float64Array;

  public abstract draw: (
    partialProps?: Partial<ShapeProps> | undefined
  ) => void;

  public constructor(
    protected createShape: (
      points: Float64Array,
      initialPartialProps?: Partial<ShapeProps> | undefined
    ) => (partialProps?: Partial<ShapeProps> | undefined) => void,
    public points: Point.Point[],
    public identifier?: string
  ) {
    this.pointsArray = new Float64Array(this.points.length * 2);
    this.points.forEach((pt, i) => {
      const arrIndex = i * 2;
      this.pointsArray[arrIndex] = pt.x;
      this.pointsArray[arrIndex + 1] = pt.y;
    });
  }

  protected updatePointsFromArray(points: Point.Point[]): void {
    this.points = points;
    points.forEach((pt, i) => {
      const arrIndex = i * 2;
      this.pointsArray[arrIndex] = pt.x;
      this.pointsArray[arrIndex + 1] = pt.y;
    });
  }
}

export class AxisMeshPoints {
  public constructor(
    public worldOrigin: Vector3.Vector3,
    public worldEnd: Vector3.Vector3,
    public origin: Point.Point,
    public end: Point.Point
  ) {}

  public toArray(): Point.Point[] {
    return [this.origin, this.end];
  }
}

export class AxisMesh extends Mesh {
  public draw: (partialProps?: Partial<ShapeProps> | undefined) => void;

  public constructor(
    createShape: (
      points: Float64Array,
      initialPartialProps?: Partial<ShapeProps> | undefined
    ) => (partialProps?: Partial<ShapeProps> | undefined) => void,
    identifier: string,
    public meshPoints: AxisMeshPoints,
    public outlineColor: Vector3.Vector3,
    public fillColor: Vector3.Vector3,
    public isHovered: boolean = false
  ) {
    super(createShape, meshPoints.toArray(), identifier);

    this.draw = createShape(this.pointsArray, {
      thickness: 2,
      fill: Vector3.toArray(this.fillColor),
      color: Vector3.toArray(this.outlineColor),
    });
  }

  public updatePoints(points: AxisMeshPoints): void {
    super.updatePointsFromArray(points.toArray());
    this.meshPoints = points;
  }
}

export class TriangleMeshPoints {
  public constructor(
    public worldBase: Vector3.Vector3,
    public worldLeft: Vector3.Vector3,
    public worldRight: Vector3.Vector3,
    public worldTip: Vector3.Vector3,
    public base: Point.Point,
    public left: Point.Point,
    public right: Point.Point,
    public tip: Point.Point
  ) {}

  public toArray(): Point.Point[] {
    return [this.left, this.right, this.tip, this.left];
  }
}

export class OutlinedTriangleMesh extends Mesh {
  public draw: (partialProps?: Partial<ShapeProps> | undefined) => void;

  public constructor(
    createShape: (
      points: Float64Array,
      initialPartialProps?: Partial<ShapeProps> | undefined
    ) => (partialProps?: Partial<ShapeProps> | undefined) => void,
    identifier: string,
    public meshPoints: TriangleMeshPoints,
    public outlineColor: Vector3.Vector3,
    public fillColor: Vector3.Vector3
  ) {
    super(createShape, meshPoints.toArray(), identifier);

    this.draw = createShape(this.pointsArray, {
      thickness: 2,
      fill: Vector3.toArray(this.fillColor),
      color: Vector3.toArray(this.outlineColor),
    });
  }

  public updatePoints(points: TriangleMeshPoints): void {
    super.updatePointsFromArray(points.toArray());
    this.meshPoints = points;
  }
}

export function computeMesh2dBounds(...meshes: Mesh[]): Rectangle.Rectangle {
  let min = Point.create(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  let max = Point.create();

  meshes.map((m) => {
    m.points.forEach((pt) => {
      min = Point.create(Math.min(pt.x, min.x), Math.min(pt.y, min.y));
      max = Point.create(Math.max(pt.x, max.x), Math.max(pt.y, max.y));
    });
  });

  return Rectangle.fromPoints(min, max);
}
