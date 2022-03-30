import { Point, Vector3 } from '@vertexvis/geometry';

export class PinEntity {
  public constructor(
    public readonly id: string,
    public readonly worldPosition: Vector3.Vector3,
    public readonly point: Point.Point
  ) {}

  public isTextPinEntity(): this is TextPinEntity {
    return false;
  }

  public isPinEntity(): this is PinEntity {
    return true;
  }
}

export type Pin = PinEntity | TextPinEntity;

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

  public override isTextPinEntity(): this is TextPinEntity {
    return true;
  }

  public override isPinEntity(): this is PinEntity {
    return false;
  }
}
