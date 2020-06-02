import * as Vector3 from './vector3';
import * as Vector4 from './vector4';

/**
 * Represents a 4D transformation matrix.
 *
 * The values of this matrix are meant to represent a 4x4 matrix.
 */
export type Matrix4 = number[];

export const create = (matrix: number[]): Matrix4 => {
  if (matrix.length !== 16) {
    throw new Error('Must have 16 items');
  }
  return matrix;
};

export const multiplyVector3 = (
  matrix: Matrix4,
  vector: Vector3.Vector3
): Vector4.Vector4 => {
  const { x: vx, y: vy, z: vz } = vector;
  const x = matrix[0] * vx + matrix[1] * vy + matrix[2] * vz + matrix[3];
  const y = matrix[4] * vx + matrix[5] * vy + matrix[6] * vz + matrix[7];
  const z = matrix[8] * vx + matrix[9] * vy + matrix[10] * vz + matrix[11];
  const w = matrix[12] * vx + matrix[13] * vy + matrix[14] * vz + matrix[15];
  return Vector4.create(x, y, z, w);
};
