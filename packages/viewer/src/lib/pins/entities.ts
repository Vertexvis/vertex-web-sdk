import { Point, Vector3 } from '@vertexvis/geometry';

export class PinEntity {
  public constructor(
    public readonly id: string,
    public readonly worldPosition: Vector3.Vector3,
    public readonly point: Point.Point
  ) {}
}

export class TextPinEntity extends PinEntity {
  public constructor(
    public readonly id: string,
    public readonly worldPosition: Vector3.Vector3,
    public readonly point: Point.Point,
    public readonly labelOffset?: Point.Point,
    public readonly labelText?: string
  ) {
    super(id, worldPosition, point);
  }
}
