import * as Point from './point';

export type Angle = number;

/**
 * Returns an `Angle` between two points.
 *
 * An angle of 0 represents an upward vector, and increases in a clockwise
 * direction.
 */
export const fromPoints = (a: Point.Point, b: Point.Point): Angle => {
  const delta = Point.subtract(b, a);
  const theta = Math.atan2(delta.y, delta.x);
  return normalize(toDegrees(theta) - 270);
};

/**
 * Normalizes the given angle, in degrees, to a number between 0 and 359.
 */
export const normalize = (degrees: Angle): Angle => {
  return (degrees + 3600) % 360;
};

/**
 * Converts the given radians to degrees.
 */
export const toDegrees = (radians: Angle): Angle => {
  return radians * (180 / Math.PI);
};

/**
 * Converts the given degrees to radians.
 */
export const toRadians = (degrees: Angle): Angle => {
  return degrees * (Math.PI / 180);
};
