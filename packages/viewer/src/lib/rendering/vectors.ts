import { BoundingSphere, Vector3 } from '@vertexvis/geometry';

export function constrainViewVector(
  viewVector: Vector3.Vector3,
  boundingSphere: BoundingSphere.BoundingSphere
): Vector3.Vector3 {
  const magnitude = Vector3.magnitude(viewVector);
  const scale = boundingSphere.radius / magnitude;

  return Vector3.scale(scale, viewVector);
}

export function updateLookAtRelativeToBoundingBoxCenter(
  originalLookAt: Vector3.Vector3,
  viewVector: Vector3.Vector3,
  boundingSphereCenter: Vector3.Vector3
): Vector3.Vector3 {
  const updatedCenterPoint = Vector3.subtract(
    boundingSphereCenter,
    originalLookAt
  );
  const orthogonalOffset = Vector3.dot(viewVector, updatedCenterPoint);
  const viewVectorMagnitudeSquared = Vector3.magnitudeSquared(viewVector);
  const offset = orthogonalOffset / viewVectorMagnitudeSquared;

  const scaledViewVectorForOffset = Vector3.scale(offset, viewVector);
  return Vector3.add(scaledViewVectorForOffset, originalLookAt);
}
