import {
  Vector2d,
  Vector3f,
} from '@vertexvis/scene-view-protos/core/protos/geometry_pb';

import { random } from './random';

export function makeVector3f(x?: number, y?: number, z?: number): Vector3f {
  const vector = new Vector3f();
  vector.setX(x ?? random.floating());
  vector.setY(y ?? random.floating());
  vector.setZ(z ?? random.floating());
  return vector;
}

export function makeVector2d(x?: number, y?: number): Vector2d {
  const v = new Vector2d();
  v.setX(x ?? random.floating());
  v.setY(y ?? random.floating());
  return v;
}
