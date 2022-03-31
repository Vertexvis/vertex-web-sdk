import { Point, Vector3 } from '@vertexvis/geometry';

interface PinInterface<T> {
  id: string;
  worldPosition: Vector3.Vector3;
  point: Point.Point;
  attributes?: T;
}
export class DefaultPin implements PinInterface<void> {
  public constructor(
    public readonly id: string,
    public readonly worldPosition: Vector3.Vector3,
    public readonly point: Point.Point
  ) {}
}

interface PinLabel {
  labelPoint: Point.Point;
  labelText?: string;
}

export type Pin = DefaultPin | TextPin;

export class TextPin implements PinInterface<PinLabel> {
  public constructor(
    public readonly id: string,
    public readonly worldPosition: Vector3.Vector3,
    public readonly point: Point.Point,
    public readonly attributes: PinLabel
  ) {}
}

export function isTextPin(pin?: Pin): pin is TextPin {
  return pin != null && (pin as TextPin).attributes?.labelPoint != null;
}

export function isDefaultPin(pin?: Pin): pin is DefaultPin {
  return pin != null && (pin as TextPin).attributes == null;
}
