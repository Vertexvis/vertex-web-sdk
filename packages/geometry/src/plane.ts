import * as Vector3 from './vector3';

/**
 * A two dimensional surface in 3D space that extends indefinitely. Represented
 * as a direction normal and distance.
 */
export interface Plane {
  normal: Vector3.Vector3;
  constant: number;
}

/**
 * Creates a new plane. Defaults to a normal of `[0,0,0]` and constant of `0`.
 *
 * @param values Values to assign to the plane.
 * @returns A new plane.
 */
export function create(values: Partial<Plane> = {}): Plane {
  return { normal: Vector3.origin(), constant: 0, ...values };
}

/**
 * Returns the perpendicular distance from the plane to the given point.
 *
 * @param plane The plane.
 * @param point The point to calculate distance from `plane`.
 * @returns A distance.
 */
export function distanceToPoint(plane: Plane, point: Vector3.Vector3): number {
  return Vector3.dot(plane.normal, point) + plane.constant;
}
