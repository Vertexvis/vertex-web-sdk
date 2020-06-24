import { BoundingBox, Vector3 } from '@vertexvis/geometry';
import * as BomItem from './bomItem';

export interface HitResult {
  position: Vector3.Vector3;
  bounds: BoundingBox.BoundingBox;
  normal: Vector3.Vector3;
  bomItem: BomItem.BomItem;
}

export function create(initial: Partial<HitResult> = {}): HitResult {
  return {
    position: Vector3.create(1, 2, 3),
    normal: Vector3.up(),
    bounds: BoundingBox.create(
      Vector3.create(1, 2, 3),
      Vector3.create(4, 5, 6)
    ),
    bomItem: BomItem.create(),
    ...initial,
  };
}

export function fromJson(json: any): HitResult {
  return {
    position: Vector3.fromArray(json.position.array),
    bounds: json.bounds,
    normal: Vector3.fromArray(json.normal.array),
    bomItem: BomItem.fromJson(json.bomItem),
  };
}
