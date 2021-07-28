import * as Plane from './plane';
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

/**
 * Computes the distance of the `ray`s origin to the given `plane`. Returns a
 * distance of 0 if the ray is coplanar and returns `undefined` if the ray does
 * not intersect with the plane.
 *
 * @param ray The ray to get the distance for.
 * @param plane The plane to compute the distance to.
 * @returns The distance to the plane, or `undefined` if it cannot be computed.
 */
export function distanceToPlane(
  ray: Ray,
  plane: Plane.Plane
): number | undefined {
  const d = Vector3.dot(plane.normal, ray.direction);
  if (d === 0) {
    // Ray is on plane.
    return Plane.distanceToPoint(plane, ray.origin) === 0 ? 0 : undefined;
  } else {
    const t = -(Vector3.dot(ray.origin, plane.normal) + plane.constant) / d;
    // Checks if ray intersects plane.
    return t >= 0 ? t : undefined;
  }
}

/**
 * Computes the intersection point of the given `ray` to the given `plane`. If
 * the ray does not intersect with the plane, then `undefined` is returned.
 *
 * @param ray The ray to intersect.
 * @param plane The plane to intersect with.
 * @returns The intersection point, or `undefined` if the ray does not
 * intersect.
 */
export function intersectPlane(
  ray: Ray,
  plane: Plane.Plane
): Vector3.Vector3 | undefined {
  const t = distanceToPlane(ray, plane);
  return t != null ? at(ray, t) : undefined;
}
