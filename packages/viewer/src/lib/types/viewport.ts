import { Dimensions, Point, Vector3 } from '@vertexvis/geometry';

export class Viewport implements Dimensions.Dimensions {
  public readonly center: Point.Point;

  public constructor(public dimensions: Dimensions.Dimensions) {
    this.center = Dimensions.center(dimensions);
  }

  public transformPoint(ndcPt: Vector3.Vector3): Point.Point {
    return Point.create(
      ndcPt.x * this.center.x + this.center.x,
      -ndcPt.y * this.center.y + this.center.y
    );
  }

  public get width(): number {
    return this.dimensions.width;
  }

  public get height(): number {
    return this.dimensions.height;
  }
}
