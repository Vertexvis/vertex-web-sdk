import * as Line3 from './line3';
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
 * Creates a plane from a normal and an arbitrary point on a plane.
 *
 * @param normal A normal.
 * @param point A point on the plane.
 * @returns A new plane.
 */
export function fromNormalAndCoplanarPoint(
  normal: Vector3.Vector3,
  point: Vector3.Vector3
): Plane {
  const constant = -Vector3.dot(point, normal);
  return create({ normal, constant });
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

/**
 * Returns the point where the line intersects with this plane. If the line does
 * not intersect, then `undefined` is returned. If the line is on the plane,
 * then the starting point of the line is returned.
 *
 * @param plane The plane to intersect.
 * @param line The line to intersect.
 * @returns An intersecting point on the plane and line.
 */
export function intersectLine(
  plane: Plane,
  line: Line3.Line3
): Vector3.Vector3 | undefined {
  const direction = Line3.direction(line);
  const denominator = Vector3.dot(plane.normal, direction);

  if (denominator === 0) {
    if (distanceToPoint(plane, line.start) === 0) {
      return line.start;
    } else {
      return undefined;
    }
  }

  const t =
    -(Vector3.dot(line.start, plane.normal) + plane.constant) / denominator;
  if (t < 0 || t > 1) {
    return undefined;
  } else {
    return Vector3.add(Vector3.scale(t, direction), line.start);
  }
}

/**
 * Project's the given `point` onto the given `plane`.
 *
 * @param plane The plane to project onto.
 * @param point The point to project.
 * @returns The projected point.
 */
export function projectPoint(
  plane: Plane,
  point: Vector3.Vector3
): Vector3.Vector3 {
  const d = distanceToPoint(plane, point);
  return Vector3.add(point, Vector3.scale(-d, plane.normal));
}
