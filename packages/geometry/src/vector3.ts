import * as Matrix4 from './matrix4';
import { lerp as lerpNumber } from './math';

/**
 * A `Vector3` represents a vector of 3 dimensions values. It may represent a
 * point or direction.
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * A `Vector3` representation as an array.
 */
export type Vector3AsArray = [x: number, y: number, z: number];

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable padding-line-between-statements */
/**
 * Returns a new `Vector3` either with the provided x, y, and z dimensions,
 * or from the provided `Partial<Vector3>` object populated with zeroes
 * wherever a component is missing.
 *
 * Providing no values to this function will result in a zero-length vector.
 */

export function create(x: number, y: number, z: number): Vector3;
export function create(partialVector: Partial<Vector3>): Vector3;
export function create(): Vector3;
export function create(...args: any[]): Vector3 {
  if (args.length === 1) {
    return {
      x: args[0].x ?? 0,
      y: args[0].y ?? 0,
      z: args[0].z ?? 0,
    };
  } else if (args.length === 3) {
    return {
      x: args[0] ?? 0,
      y: args[1] ?? 0,
      z: args[2] ?? 0,
    };
  }

  return {
    x: 0,
    y: 0,
    z: 0,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
/* eslint-enable padding-line-between-statements */

/**
 * Checks if each component of the given vector is populated with a numeric
 * component. A component is invalid if it contains a non-finite or NaN value.
 */
export function isValid({ x, y, z }: Vector3): boolean {
  return [x, y, z].every((v) => isFinite(v) && !isNaN(v));
}

/**
 * Returns a vector representing the scale elements of `matrix`.
 */
export function fromMatrixScale(matrix: Matrix4.Matrix4): Vector3 {
  const m = Matrix4.toObject(matrix);
  return {
    x: Math.hypot(m.m11, m.m21, m.m31),
    y: Math.hypot(m.m12, m.m22, m.m32),
    z: Math.hypot(m.m13, m.m23, m.m33),
  };
}

/**
 * Returns a vector representing the position elements of `matrix`.
 */
export function fromMatrixPosition(matrix: Matrix4.Matrix4): Vector3 {
  const m = Matrix4.toObject(matrix);
  return { x: m.m14, y: m.m24, z: m.m34 };
}

/**
 * Parses a JSON string representation of a Vector3 and returns an object.
 *
 * @param json A JSON string, either in the form `[x,y,z]` or `{"x": 0, "y": 0, "z": 0}`
 * @returns A parsed Vector3.
 */
export function fromJson(json: string): Vector3 {
  const obj = JSON.parse(json);
  if (Array.isArray(obj)) {
    const [x, y, z] = obj;
    return create(x, y, z);
  } else {
    const { x, y, z } = obj;
    return create(x, y, z);
  }
}

/**
 * Creates a `Vector3` from an array. Pass `offset` to read values from the
 * starting index.
 *
 * @see #toArray()
 * @see #create()
 */
export function fromArray(nums: number[], offset = 0): Vector3 {
  const x = nums[offset];
  const y = nums[offset + 1];
  const z = nums[offset + 2];
  return create(x, y, z);
}

/**
 * Converts a Vector3 to an array where the values of the vector will be
 * represented as [x, y, z];
 *
 * @see #fromArray()
 * @see #create()
 */
export function toArray({ x, y, z }: Vector3): Vector3AsArray {
  return [x, y, z];
}

/**
 * Returns a directional vector on the positive x axis, Vector3(1, 0, 0).
 */
export function right(): Vector3 {
  return create(1, 0, 0);
}

/**
 * Returns a directional vector on the positive y axis, Vector3(0, 1, 0).
 */
export function up(): Vector3 {
  return create(0, 1, 0);
}

/**
 * Returns a directional vector on the positive z axis, Vector3(0, 0, -1).
 */
export function forward(): Vector3 {
  return create(0, 0, -1);
}

/**
 * Returns a directional vector on the negative x axis, Vector3(-1, 0, 0).
 */
export function left(): Vector3 {
  return create(-1, 0, 0);
}

/**
 * Returns a directional vector on the negative y axis, Vector3(0, -1, 0).
 */
export function down(): Vector3 {
  return create(0, -1, 0);
}

/**
 * Returns a directional vector on the negative z axis, Vector3(0, 0, 1).
 */
export function back(): Vector3 {
  return create(0, 0, 1);
}

/**
 * Returns a vector at the origin, Vector3(0, 0, 0).
 */
export function origin(): Vector3 {
  return create(0, 0, 0);
}

/**
 * Returns a vector with that will have a magnitude of 1.
 */
export function normalize(vector: Vector3): Vector3 {
  const length = magnitude(vector);
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

/**
 * Returns the straight-line length from (0, 0, 0) to the given vector.
 */
export function magnitude(vector: Vector3): number {
  return Math.sqrt(magnitudeSquared(vector));
}

/**
 * Returns the straight-line length from (0, 0, 0) to the given vector).
 *
 * When comparing lengths of vectors, you should use this function as it's
 * slightly more efficient to calculate.
 */
export function magnitudeSquared(vector: Vector3): number {
  return vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
}

/**
 * Returns a vector that is the cross product of two vectors.
 *
 * The cross product of two vectors results in a third vector which is
 * perpendicular to the two input vectors. The result's magnitude is equal to
 * the magnitudes of the two inputs multiplied together and then multiplied by
 * the sine of the angle between the inputs. You can determine the direction of
 * the result vector using the "left hand rule".
 */
export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Returns a vector that is the sum of two vectors.
 */
export function add(a: Vector3, ...vectors: Vector3[]): Vector3 {
  return vectors.reduce((res, next) => {
    return { x: res.x + next.x, y: res.y + next.y, z: res.z + next.z };
  }, a);
}

/**
 * Returns a vector that is the difference between two vectors.
 */
export function subtract(a: Vector3, ...vectors: Vector3[]): Vector3 {
  return vectors.reduce((res, next) => {
    return { x: res.x - next.x, y: res.y - next.y, z: res.z - next.z };
  }, a);
}

/**
 * Returns a vector that where each component of `b` is multiplied with `a`.
 */
export function multiply(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z };
}

/**
 * Returns a vector where each value of a vector is multiplied by the `scalar`.
 */
export function scale(scalar: number, vector: Vector3): Vector3 {
  return { x: vector.x * scalar, y: vector.y * scalar, z: vector.z * scalar };
}

/**
 * Returns a value representing the dot product of two vectors.
 *
 * The dot product is a float value equal to the magnitudes of the two vectors
 * multiplied together and then multiplied by the cosine of the angle between
 * them.
 */
export function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Returns the angle, in radians, between two vectors.
 *
 * The angle returned is the unsigned angle between the two vectors. This means
 * the smaller of the two possible angles between the two vectors is used. The
 * result is never greater than 180 degrees.
 */
export function angleTo(a: Vector3, b: Vector3): number {
  const theta = dot(a, b) / (magnitude(a) * magnitude(b));
  // Clamp to avoid numerical problems.
  return Math.acos(theta);
}

/**
 * Performs a projection of a `vector` onto `onNormal`.
 *
 * A projection is represented as the nearest point along a normal to a vector,
 * which constructs a triangle from the origin, to the vector, to the projected
 * point.
 *
 * ```
 * Vector -->  *   * <-- Projected
 *              \
 *               \ | <-- Normal
 *                \|
 *                 * <-- Origin
 * ```
 */
export function project(vector: Vector3, onNormal: Vector3): Vector3 {
  return scale(dot(onNormal, vector) / magnitude(onNormal), onNormal);
}

/**
 * Returns a vector that is rotated about an origin point.
 *
 * @param angle The angle to rotate, in radians.
 * @param point The origin point to rotate around.
 * @param axisDirection The direction used to compute the axis.
 * @param axisPosition The point of the axis.
 */
export function rotateAboutAxis(
  angle: number,
  point: Vector3,
  axisDirection: Vector3,
  axisPosition: Vector3
): Vector3 {
  if (angle !== 0) {
    const { x, y, z } = point;
    const { x: a, y: b, z: c } = axisPosition;
    const { x: u, y: v, z: w } = axisDirection;

    const newX =
      (a * (v * v + w * w) - u * (b * v + c * w - u * x - v * y - w * z)) *
        (1 - Math.cos(angle)) +
      x * Math.cos(angle) +
      (-c * v + b * w - w * y + v * z) * Math.sin(angle);

    const newY =
      (b * (u * u + w * w) - v * (a * u + c * w - u * x - v * y - w * z)) *
        (1 - Math.cos(angle)) +
      y * Math.cos(angle) +
      (c * u - a * w + w * x - u * z) * Math.sin(angle);

    const newZ =
      (c * (u * u + v * v) - w * (a * u + b * v - u * x - v * y - w * z)) *
        (1 - Math.cos(angle)) +
      z * Math.cos(angle) +
      (-b * u + a * v - v * x + u * y) * Math.sin(angle);

    return { x: newX, y: newY, z: newZ };
  } else {
    return point;
  }
}

/**
 * Returns a vector that is multiplied with a matrix.
 */
export function transformMatrix(vector: Vector3, m: Matrix4.Matrix4): Vector3 {
  const { x, y, z } = vector;
  const w = 1 / (m[3] * x + m[7] * y + m[11] * z + m[15]);
  return {
    x: (m[0] * x + m[4] * y + m[8] * z + m[12]) * w,
    y: (m[1] * x + m[5] * y + m[9] * z + m[13]) * w,
    z: (m[2] * x + m[6] * y + m[10] * z + m[14]) * w,
  };
}

/**
 * Euclidean distance between two vectors
 */
export function distance(a: Vector3, b: Vector3): number {
  return Math.sqrt(distanceSquared(a, b));
}

/**
 * Returns the squared distance between two vectors. If you're just comparing
 * distances, this is slightly more efficient than `distanceTo`.
 */
export function distanceSquared(a: Vector3, b: Vector3): number {
  const { x: dx, y: dy, z: dz } = subtract(a, b);
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Returns `true` if two vectors have the same values.
 */
export function isEqual(a: Vector3, b: Vector3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

/**
 * Returns a vector that contains the largest components of `a` and `b`.
 */
export function max(a: Vector3, b: Vector3): Vector3 {
  return create(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
}

/**
 * Returns a vector that contains the smallest components of `a` and `b`.
 */
export function min(a: Vector3, b: Vector3): Vector3 {
  return create(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
}

/**
 * Returns a vector that each of its component negated.
 */
export function negate(vector: Vector3): Vector3 {
  return { x: -vector.x, y: -vector.y, z: -vector.z };
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
export function lerp(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: lerpNumber(a.x, b.x, t),
    y: lerpNumber(a.y, b.y, t),
    z: lerpNumber(a.z, b.z, t),
  };
}
