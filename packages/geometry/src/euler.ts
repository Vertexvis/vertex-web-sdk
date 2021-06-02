import * as Matrix4 from './matrix4';
import { clamp } from './util';

export type EulerOrder = 'xyz' | 'yzx' | 'zxy' | 'xzy' | 'yxz' | 'zyx';

export interface Euler {
  x: number;
  y: number;
  z: number;
  order: EulerOrder;
}

export function create(value: Partial<Euler> = {}): Euler {
  return { x: 0, y: 0, z: 0, order: 'xyz', ...value };
}

export function fromRotationMatrix(
  matrix: Matrix4.Matrix4,
  order: EulerOrder = 'xyz'
): Euler {
  const m = Matrix4.toObject(matrix);

  let x = 0,
    y = 0,
    z = 0;

  if (order === 'xyz') {
    y = Math.asin(clamp(m.m13, -1, 1));
    if (Math.abs(m.m13) < 0.9999999) {
      x = Math.atan2(-m.m23, m.m33);
      z = Math.atan2(-m.m12, m.m11);
    } else {
      x = Math.atan2(m.m32, m.m22);
      z = 0;
    }
  } else if (order === 'yxz') {
    x = Math.asin(-clamp(m.m23, -1, 1));
    if (Math.abs(m.m23) < 0.9999999) {
      y = Math.atan2(m.m13, m.m33);
      z = Math.atan2(m.m21, m.m22);
    } else {
      y = Math.atan2(-m.m31, m.m11);
      z = 0;
    }
  } else if (order === 'zxy') {
    x = Math.asin(clamp(m.m32, -1, 1));
    if (Math.abs(m.m32) < 0.9999999) {
      y = Math.atan2(-m.m31, m.m33);
      z = Math.atan2(-m.m12, m.m22);
    } else {
      y = 0;
      z = Math.atan2(m.m21, m.m11);
    }
  } else if (order === 'zyx') {
    y = Math.asin(-clamp(m.m31, -1, 1));
    if (Math.abs(m.m31) < 0.9999999) {
      x = Math.atan2(m.m32, m.m33);
      z = Math.atan2(m.m21, m.m11);
    } else {
      x = 0;
      z = Math.atan2(-m.m12, m.m22);
    }
  } else if (order === 'yzx') {
    z = Math.asin(clamp(m.m21, -1, 1));
    if (Math.abs(m.m21) < 0.9999999) {
      x = Math.atan2(-m.m23, m.m22);
      y = Math.atan2(-m.m31, m.m11);
    } else {
      x = 0;
      y = Math.atan2(m.m13, m.m33);
    }
  } else if (order === 'xzy') {
    z = Math.asin(-clamp(m.m12, -1, 1));
    if (Math.abs(m.m12) < 0.9999999) {
      x = Math.atan2(m.m32, m.m22);
      y = Math.atan2(m.m13, m.m11);
    } else {
      x = Math.atan2(-m.m23, m.m33);
      y = 0;
    }
  }

  return { x, y, z, order };
}

export function fromJson(json: string): Euler {
  const obj = JSON.parse(json);
  if (Array.isArray(obj)) {
    const [x, y, z, order = 'xyz'] = obj;
    return { x, y, z, order };
  } else {
    const { x, y, z, order = 'xyz' } = obj;
    return { x, y, z, order };
  }
}

/**
 * Type guard that checks if the given type is a Euler.
 */
export function isType(obj: unknown): obj is Euler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = obj as any;
  return (
    o != null &&
    o.hasOwnProperty('x') &&
    o.hasOwnProperty('y') &&
    o.hasOwnProperty('z') &&
    o.hasOwnProperty('order')
  );
}
