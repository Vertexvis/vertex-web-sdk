import * as BoundingBox from './boundingBox';
import * as Vector3 from './vector3';

/**
 * A `BoundingSphere` describes a bounding volume as a sphere.
 */
export interface BoundingSphere {
  center: Vector3.Vector3;
  radius: number;
  epsilon: number;
}

/**
 * Returns a `BoundingSphere` that encompasses the provided `BoundingBox`.
 */
export const create = (
  boundingBox: BoundingBox.BoundingBox
): BoundingSphere => {
  const boundingBoxCenter = BoundingBox.center(boundingBox);
  const centerToBoundingPlane = Vector3.subtract(
    boundingBox.max,
    boundingBoxCenter
  );
  const radius = Vector3.magnitude(centerToBoundingPlane);
  const length = Math.max(radius, Vector3.magnitude(boundingBoxCenter));
  const epsilon = length === 0 ? 1.0 : length * 1e-6;

  return { center: boundingBoxCenter, radius, epsilon };
};
