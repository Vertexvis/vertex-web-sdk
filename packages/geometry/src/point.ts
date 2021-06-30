import * as Angle from './angle';
import { lerp as lerpNumber } from './math';

/**
 * A `Point` represents a cartesian coordinate with a horizontal and vertical
 * position or length.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Returns a new `Point` with the given horizontal and vertical position.
 */
export function create(x = 0, y = 0): Point {
  return { x, y };
}

/**
 * Converts a polar coordinate (length and angle) into a Cartesian coordinate.
 */
export function polar(length: number, radians: Angle.Angle): Point {
  const x = Math.cos(radians) * length;
  const y = Math.sin(radians) * length;
  return create(x, y);
}

/**
 * Returns the distance between two points.
 */
export function distance(a: Point, b: Point): number {
  const delta = subtract(a, b);
  return Math.sqrt(delta.x * delta.x + delta.y * delta.y);
}

/**
 * Returns a new `Point` where `b` is subtracted from `a`.
 */
export function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Returns a new `Point` where `b` is added to `a`.
 */
export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Returns `true` if the `x` and `y` positions of `a` and `b` are equal.
 */
export function isEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Performs a linear interpolation between `a` and `b` and returns the result.
 * The value of `t` is clamped between `[0, 1]`.
 *
 * @param a The start value.
 * @param b The end value.
 * @param t A value between 0 and 1.
 * @returns A point between `a` and `b`.
 */
export function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: lerpNumber(a.x, b.x, t),
    y: lerpNumber(a.y, b.y, t),
  };
}

/**
 * Returns a new `Point` where `x` and `y` are inverted.
 */
export function negate(pt: Point): Point {
  return create(-pt.x, -pt.y);
}

/**
 * Returns a new `Point` where `x` and `y` are multiplied by the given scale
 * factors.
 */
export function scale(pt: Point, scaleX: number, scaleY: number): Point {
  return {
    x: pt.x * scaleX,
    y: pt.y * scaleY,
  };
}
