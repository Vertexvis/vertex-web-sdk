import { Point, Vector3 } from '@vertexvis/geometry';

export class PinEntity {
  public constructor(
    public readonly id: string,
    public readonly worldPosition: Vector3.Vector3,
    public readonly point: Point.Point
  ) {}
}

export type Pin = PinEntity | TextPinEntity;

export class TextPinEntity extends PinEntity {
  public constructor(
    public readonly id: string,
    public readonly worldPosition: Vector3.Vector3,
    public readonly point: Point.Point,
    public readonly labelOffset: Point.Point,
    public readonly labelText?: string
  ) {
    super(id, worldPosition, point);
  }
}

export function isTextPinEntity(pin?: Pin): pin is TextPinEntity {
  return pin != null && (pin as TextPinEntity).labelOffset != null;
}

export function isPinEntity(pin?: Pin): pin is PinEntity {
  return pin != null && (pin as TextPinEntity).labelOffset == null;
}
