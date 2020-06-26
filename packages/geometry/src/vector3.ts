/**
 * A `Vector3` represents a vector of 3 dimensions values. It may represent a
 * point or direction.
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

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
      x: args[0].x || 0,
      y: args[0].y || 0,
      z: args[0].z || 0,
    };
  } else if (args.length === 3) {
    return {
      x: args[0],
      y: args[1],
      z: args[2],
    };
  }

  return {
    x: 0,
    y: 0,
    z: 0,
  };
}
/* eslint-enable padding-line-between-statements */

/**
 * Checks if each component of the given vector is populated with a numeric
 * component. A component is invalid if it contains a non-finite or NaN value.
 */
export const isValid = ({ x, y, z }: Vector3): boolean => {
  return [x, y, z].every(v => isFinite(v) && !isNaN(v));
};

/**
 * Converts an array of [x, y, z] values to a `Vector3`.
 *
 * @see #toArray()
 * @see #create()
 */
export const fromArray = ([x, y, z]: number[]): Vector3 => {
  return create(x, y, z);
};

/**
 * Converts a Vector3 to an array where the values of the vector will be
 * represented as [x, y, z];
 *
 * @see #fromArray()
 * @see #create()
 */
export const toArray = ({ x, y, z }: Vector3): number[] => {
  return [x, y, z];
};

/**
 * Returns a directional vector on the positive x axis, Vector3(1, 0, 0).
 */
export const right = (): Vector3 => create(1, 0, 0);

/**
 * Returns a directional vector on the positive y axis, Vector3(0, 1, 0).
 */
export const up = (): Vector3 => create(0, 1, 0);

/**
 * Returns a directional vector on the positive z axis, Vector3(0, 0, -1).
 */
export const forward = (): Vector3 => create(0, 0, -1);

/**
 * Returns a directional vector on the negative x axis, Vector3(-1, 0, 0).
 */
export const left = (): Vector3 => create(-1, 0, 0);

/**
 * Returns a directional vector on the negative y axis, Vector3(0, -1, 0).
 */
export const down = (): Vector3 => create(0, -1, 0);

/**
 * Returns a directional vector on the negative z axis, Vector3(0, 0, 1).
 */
export const back = (): Vector3 => create(0, 0, 1);

/**
 * Returns a vector at the origin, Vector3(0, 0, 0).
 */
export const origin = (): Vector3 => create(0, 0, 0);

/**
 * Returns a vector with that will have a magnitude of 1.
 */
export const normalize = (vector: Vector3): Vector3 => {
  const length = magnitude(vector);
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
};

/**
 * Returns the length of the given vector.
 */
export const magnitude = (vector: Vector3): number => {
  return Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
  );
};

/**
 * Returns a vector that is the cross product of two vectors.
 *
 * The cross product of two vectors results in a third vector which is
 * perpendicular to the two input vectors. The result's magnitude is equal to
 * the magnitudes of the two inputs multiplied together and then multiplied by
 * the sine of the angle between the inputs. You can determine the direction of
 * the result vector using the "left hand rule".
 */
export const cross = (a: Vector3, b: Vector3): Vector3 => {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
};

/**
 * Returns a vector that is the sum of two vectors.
 */
export const add = (a: Vector3, ...vectors: Vector3[]): Vector3 => {
  return vectors.reduce((acc, current) => {
    return { x: acc.x + current.x, y: acc.y + current.y, z: acc.z + current.z };
  }, a);
};

/**
 * Returns a vector that is the difference between two vectors.
 */
export const subtract = (a: Vector3, b: Vector3): Vector3 => {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
};

/**
 * Returns a vector that where each component of `b` is multiplied with `a`.
 */
export const multiply = (a: Vector3, b: Vector3): Vector3 => {
  return { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z };
};

/**
 * Returns a vector where each value of a vector is multiplied by the `scalar`.
 */
export const scale = (scalar: number, vector: Vector3): Vector3 => {
  return { x: vector.x * scalar, y: vector.y * scalar, z: vector.z * scalar };
};

/**
 * Returns a value representing the dot product of two vectors.
 *
 * The dot product is a float value equal to the magnitudes of the two vectors
 * multiplied together and then multiplied by the cosine of the angle between
 * them.
 */
export const dot = (a: Vector3, b: Vector3): number => {
  return a.x * b.x + a.y * b.y + a.z * b.z;
};

/**
 * Returns the angle, in radians, between two vectors.
 *
 * The angle returned is the unsigned angle between the two vectors. This means
 * the smaller of the two possible angles between the two vectors is used. The
 * result is never greater than 180 degrees.
 */
export const angleTo = (a: Vector3, b: Vector3): number => {
  const theta = dot(a, b) / (magnitude(a) * magnitude(b));
  // Clamp to avoid numerical problems.
  return Math.acos(theta);
};

/**
 * Performs a projection of `projected` onto `onto`.
 *
 * The result of the projection is the `onto` vector scaled corresponding to
 * the dot product of the `onto` and `projected` vectors.
 */
export const projection = (onto: Vector3, projected: Vector3): Vector3 => {
  return scale(dot(onto, projected) / magnitude(onto), onto);
};

/**
 * Returns a vector that is rotated about an origin point.
 *
 * @param angle The angle to rotate, in radians.
 * @param point The origin point to rotate around.
 * @param axisDirection The direction used to compute the axis.
 * @param axisPosition The point of the axis.
 */
export const rotateAboutAxis = (
  angle: number,
  point: Vector3,
  axisDirection: Vector3,
  axisPosition: Vector3
): Vector3 => {
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
};

/**
 * Euclidean distance between two vectors
 */
export const distance = (a: Vector3, b: Vector3): number =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

/**
 * Returns `true` if two vectors have the same values.
 */
export const isEqual = (a: Vector3, b: Vector3): boolean => {
  return a.x === b.x && a.y === b.y && a.z === b.z;
};

/**
 * Returns a vector that contains the largest components of `a` and `b`.
 */
export const max = (a: Vector3, b: Vector3): Vector3 =>
  create(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));

/**
 * Returns a vector that contains the smallest components of `a` and `b`.
 */
export const min = (a: Vector3, b: Vector3): Vector3 =>
  create(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
