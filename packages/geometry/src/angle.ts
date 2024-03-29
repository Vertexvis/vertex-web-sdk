import * as Point from './point';

export type Angle = number;

/**
 * Returns an `Angle` between two points, in radians.
 *
 * @param a The starting point.
 * @param b The ending point.
 * @returns An angle in radians.
 */
export function fromPoints(a: Point.Point, b: Point.Point): Angle {
  const delta = Point.subtract(b, a);
  const theta = Math.atan2(delta.y, delta.x);
  return theta;
}

/**
 * Returns an `Angle` between two points, in degrees.
 *
 * An angle of 0 represents an upward vector, and increases in a clockwise
 * direction.
 *
 * @deprecated Use {@link fromPoints} instead.
 */
export function fromPointsInDegrees(a: Point.Point, b: Point.Point): Angle {
  const delta = Point.subtract(b, a);
  const theta = Math.atan2(delta.y, delta.x);
  return normalize(toDegrees(theta) - 270);
}

/**
 * Normalizes the given angle, in degrees, to a number greater than or equal to 0 and less than 360.
 */
export function normalize(degrees: Angle): Angle {
  return (degrees + 3600) % 360;
}

/**
 * Normalizes the given angle, in radians, to a number greater than or equal to 0 and less than 2 PI.
 */
export function normalizeRadians(radians: Angle): Angle {
  return toRadians(normalize(toDegrees(radians)));
}

/**
 * Converts the given radians to degrees.
 */
export function toDegrees(radians: Angle): Angle {
  return radians * (180 / Math.PI);
}

/**
 * Converts the given degrees to radians.
 */
export function toRadians(degrees: Angle): Angle {
  return degrees * (Math.PI / 180);
}
