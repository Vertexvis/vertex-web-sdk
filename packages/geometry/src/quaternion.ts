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
  const m = Matrix4.toObject(matrix);
  const scale = Vector3.fromMatrixScale(matrix);

  const is1 = 1 / scale.x;
  const is2 = 1 / scale.y;
  const is3 = 1 / scale.z;

  const sm11 = m.m11 * is1;
  const sm12 = m.m21 * is2;
  const sm13 = m.m31 * is3;
  const sm21 = m.m12 * is1;
  const sm22 = m.m22 * is2;
  const sm23 = m.m32 * is3;
  const sm31 = m.m13 * is1;
  const sm32 = m.m23 * is2;
  const sm33 = m.m33 * is3;

  const trace = sm11 + sm22 + sm33;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1.0) * 2;
    return {
      x: (sm23 - sm32) / s,
      y: (sm31 - sm13) / s,
      z: (sm12 - sm21) / s,
      w: 0.25 * s,
    };
  } else if (sm11 > sm22 && sm11 > sm33) {
    const s = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    return {
      x: 0.25 * s,
      y: (sm12 + sm21) / s,
      z: (sm31 + sm13) / s,
      w: s,
    };
  } else if (sm22 > sm33) {
    const s = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    return {
      x: (sm12 + sm21) / s,
      y: 0.25 * s,
      z: (sm23 + sm32) / s,
      w: (sm31 - sm13) / s,
    };
  } else {
    const s = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    return {
      x: (sm31 + sm13) / s,
      y: (sm23 + sm32) / s,
      z: 0.25 * s,
      w: (sm12 - sm21) / s,
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
