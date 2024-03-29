import { Point, Vector3 } from '@vertexvis/geometry';
import Chance from 'chance';

export const random = new Chance();

export function randomPoint(): Point.Point {
  return Point.create(random.integer(), random.integer());
}

export function randomVector3(): Vector3.Vector3 {
  return Vector3.create(
    random.floating(),
    random.floating(),
    random.floating()
  );
}

export function randomNormalVector3(): Vector3.Vector3 {
  return Vector3.normalize(
    Vector3.create(
      random.floating({
        min: 0,
        max: 1,
      }),
      random.floating({
        min: 0,
        max: 1,
      }),
      random.floating({
        min: 0,
        max: 1,
      })
    )
  );
}
