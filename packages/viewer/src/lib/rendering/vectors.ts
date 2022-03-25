import { BoundingSphere, Vector3 } from '@vertexvis/geometry';

export function constrainViewVector(
  viewVector: Vector3.Vector3,
  boundingSphere: BoundingSphere.BoundingSphere
): Vector3.Vector3 {
  const magnitude = Vector3.magnitude(viewVector);
  const scale = boundingSphere.radius / magnitude;

  return Vector3.scale(scale, viewVector);
}
