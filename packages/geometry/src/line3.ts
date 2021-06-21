import * as Matrix4 from './matrix4';
import * as Vector3 from './vector3';

/**
 * A `Line3` represents a line segment between a `start` and `end` point.
 */
export interface Line3 {
  /**
   * The start of the line segment.
   */
  start: Vector3.Vector3;

  /**
   * The end of the line segment.
   */
  end: Vector3.Vector3;
}

/**
 * Creates a new `Line3`. If unspecified, the start and end values of the line
 * will be at origin.
 *
 * @param values The values to assign to the line.
 */
export function create(values: Partial<Line3> = {}): Line3 {
  return {
    start: values.start ?? Vector3.origin(),
    end: values.end ?? Vector3.origin(),
  };
}

/**
 * Returns the point that is halfway between start and end.
 */
export function center(line: Line3): Vector3.Vector3 {
  return Vector3.lerp(line.start, line.end, 0.5);
}

/**
 * Returns a line where the start and end points are transformed with the given
 * matrix.
 *
 * @param line The line to transform.
 * @param matrix The matrix to apply.
 * @returns A transformed line.
 */
export function transformMatrix(line: Line3, matrix: Matrix4.Matrix4): Line3 {
  const start = Vector3.transformMatrix(line.start, matrix);
  const end = Vector3.transformMatrix(line.end, matrix);
  return { start, end };
}

/**
 * Euclidean distance between the start and end points of the line.
 */
export function distance(line: Line3): number {
  return Vector3.distance(line.start, line.end);
}

/**
 * Returns the squared distance between a line's start and end point. If you're
 * just comparing distances, this is slightly more efficient than `distanceTo`.
 */
export function distanceSquared(line: Line3): number {
  return Vector3.distanceSquared(line.start, line.end);
}
