import * as Vector3 from './vector3';

/**
 * A `Ray` represents an infinite line starting at `origin` and going in
 * `direction`.
 */
export interface Ray {
  /**
   * The origin point of the ray.
   */
  origin: Vector3.Vector3;

  /**
   * A normal that describes the direction of the ray from origin.
   */
  direction: Vector3.Vector3;
}

/**
 * Creates a new ray with the given values, or using default values if none are
 * provided. The direction defaults to `{x: 0, y: 0, z: -1}` if undefined.
 *
 * @param value The values of the ray.
 * @returns A new ray.
 */
export function create(value: Partial<Ray> = {}): Ray {
  return {
    origin: value.origin ?? Vector3.origin(),
    direction: value.direction ?? Vector3.forward(),
  };
}

/**
 * Returns a point at the given distance along this ray.
 *
 * @param ray The ray to get the point on.
 * @param distance A distance from origin along the ray's direction.
 * @returns A point on the ray.
 */
export function at(ray: Ray, distance: number): Vector3.Vector3 {
  return Vector3.add(Vector3.scale(distance, ray.direction), ray.origin);
}
