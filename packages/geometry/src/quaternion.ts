import * as Euler from './euler';
import * as Matrix4 from './matrix4';
import * as Vector3 from './vector3';

/**
 * A type that represents a
 * [quaternion](http://en.wikipedia.org/wiki/Quaternion). Quaternions are used
 * in 3D graphics to represent
 * [rotations](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation).
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * An array representation of a `Quaternion`.
 */
export type QuaternionAsArray = [x: number, y: number, z: number, w: number];

/**
 * Returns a new quaternion. If `value` is undefined, then `{x: 0, y: 0, z: 0,
 * w: 1}` is returned.
 */
export function create(value: Partial<Quaternion> = {}): Quaternion {
  return { x: 0, y: 0, z: 0, w: 1, ...value };
}

/**
 * Parses a JSON string representation of a `Quaternion`.
 *
 * @param json A JSON string either in the form of `[x, y, z, w]` or `{"x": 0, "y": 0, "z": 0, "w": 0}`.
 * @returns A parsed `Quaternion`.
 */
export function fromJson(json: string): Quaternion {
  const obj = JSON.parse(json);
  if (Array.isArray(obj)) {
    const [x, y, z, w] = obj;
    return create({ x, y, z, w });
  } else {
    return create(obj);
  }
}

/**
 * Returns a quaternion with that will have a magnitude of 1.
 */
export function normalize(q: Quaternion): Quaternion {
  return scale(1 / magnitude(q), q);
}

/**
 * Returns the magnitude of the provided quaternion.
 */
export function magnitude(q: Quaternion): number {
  return Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
}

/**
 * Returns a quaternion where each component is multiplied by the `scalar`.
 */
export function scale(scalar: number, q: Quaternion): Quaternion {
  return create({
    w: q.w * scalar,
    x: q.x * scalar,
    y: q.y * scalar,
    z: q.z * scalar,
  });
}

/**
 * Creates a `Quaternion` that is rotated the given radians around an axis.
 *
 * @param axis The axis to rotate around.
 * @param radians The rotation, in radians.
 * @returns A rotated quaternion.
 */
export function fromAxisAngle(
  axis: Vector3.Vector3,
  radians: number
): Quaternion {
  const halfAngle = radians / 2;
  const s = Math.sin(halfAngle);

  const x = axis.x * s;
  const y = axis.y * s;
  const z = axis.z * s;
  const w = Math.cos(halfAngle);
  return { x, y, z, w };
}

/**
 * Returns a quaternion using the upper 3x3 of a pure rotation matrix
 * (unscaled).
 */
export function fromMatrixRotation(matrix: Matrix4.Matrix4): Quaternion {
  // Determine the scalars for each vector
  const scale = Vector3.fromMatrixScale(matrix);
  const oneOverScaleVector = Vector3.create(
    1 / scale.x,
    1 / scale.y,
    1 / scale.z
  );

  // Scale the matrix
  const scaledMatrix = Matrix4.scale(matrix, oneOverScaleVector);
  const sM = Matrix4.toObjectRowMajor(scaledMatrix);

  const trace = sM.m11 + sM.m22 + sM.m33;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return {
      x: (sM.m23 - sM.m32) / s,
      y: (sM.m31 - sM.m13) / s,
      z: (sM.m12 - sM.m21) / s,
      w: 0.25 * s,
    };
  } else if (sM.m11 > sM.m22 && sM.m11 > sM.m33) {
    const s = Math.sqrt(1 + sM.m11 - sM.m22 - sM.m33) * 2;
    return {
      x: 0.25 * s,
      y: (sM.m12 + sM.m21) / s,
      z: (sM.m31 + sM.m13) / s,
      w: (sM.m23 - sM.m32) / s,
    };
  } else if (sM.m22 > sM.m33) {
    const s = Math.sqrt(1 + sM.m22 - sM.m11 - sM.m33) * 2;
    return {
      x: (sM.m12 + sM.m21) / s,
      y: 0.25 * s,
      z: (sM.m23 + sM.m32) / s,
      w: (sM.m31 - sM.m13) / s,
    };
  } else {
    const s = Math.sqrt(1 + sM.m33 - sM.m11 - sM.m22) * 2;
    return {
      x: (sM.m31 + sM.m13) / s,
      y: (sM.m23 + sM.m32) / s,
      z: 0.25 * s,
      w: (sM.m12 - sM.m21) / s,
    };
  }
}

export function fromEuler(euler: Euler.Euler): Quaternion {
  const { x: ex, y: ey, z: ez, order } = euler;
  const c1 = Math.cos(ex / 2);
  const c2 = Math.cos(ey / 2);
  const c3 = Math.cos(ez / 2);

  const s1 = Math.sin(ex / 2);
  const s2 = Math.sin(ey / 2);
  const s3 = Math.sin(ez / 2);

  let x = 0,
    y = 0,
    z = 0,
    w = 0;

  switch (order) {
    case 'xyz':
      x = s1 * c2 * c3 + c1 * s2 * s3;
      y = c1 * s2 * c3 - s1 * c2 * s3;
      z = c1 * c2 * s3 + s1 * s2 * c3;
      w = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case 'yxz':
      x = s1 * c2 * c3 + c1 * s2 * s3;
      y = c1 * s2 * c3 - s1 * c2 * s3;
      z = c1 * c2 * s3 - s1 * s2 * c3;
      w = c1 * c2 * c3 + s1 * s2 * s3;
      break;

    case 'zxy':
      x = s1 * c2 * c3 - c1 * s2 * s3;
      y = c1 * s2 * c3 + s1 * c2 * s3;
      z = c1 * c2 * s3 + s1 * s2 * c3;
      w = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case 'zyx':
      x = s1 * c2 * c3 - c1 * s2 * s3;
      y = c1 * s2 * c3 + s1 * c2 * s3;
      z = c1 * c2 * s3 - s1 * s2 * c3;
      w = c1 * c2 * c3 + s1 * s2 * s3;
      break;

    case 'yzx':
      x = s1 * c2 * c3 + c1 * s2 * s3;
      y = c1 * s2 * c3 + s1 * c2 * s3;
      z = c1 * c2 * s3 - s1 * s2 * c3;
      w = c1 * c2 * c3 - s1 * s2 * s3;
      break;

    case 'xzy':
      x = s1 * c2 * c3 - c1 * s2 * s3;
      y = c1 * s2 * c3 - s1 * c2 * s3;
      z = c1 * c2 * s3 + s1 * s2 * c3;
      w = c1 * c2 * c3 + s1 * s2 * s3;
      break;
  }

  return { x, y, z, w };
}

/**
 * Multiplies `a` x `b` and returns a new quaternion with the result.
 */
export function multiply(a: Quaternion, b: Quaternion): Quaternion {
  // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

  return {
    x: a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
    y: a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
    z: a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

/**
 * Type guard that checks if the given type is a Quaternion.
 */
export function isType(obj: unknown): obj is Quaternion {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = obj as any;
  return (
    o != null &&
    o.hasOwnProperty('x') &&
    o.hasOwnProperty('y') &&
    o.hasOwnProperty('z') &&
    o.hasOwnProperty('w')
  );
}
