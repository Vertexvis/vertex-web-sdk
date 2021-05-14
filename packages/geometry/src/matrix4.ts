import * as Matrix3 from './matrix3';
import * as Vector3 from './vector3';
import * as Vector4 from './vector4';

/**
 * Represents a 4D transformation matrix.
 *
 * The values of this matrix are meant to represent a 4x4 matrix.
 */
export type Matrix4 = number[];

export function identity(): Matrix4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

export function create(matrix: number[]): Matrix4 {
  if (matrix.length !== 16) {
    throw new Error('Must have 16 items');
  }
  return matrix;
}

export function inverse(matrix: Matrix4): Matrix4 {
  const m11 = Matrix3.create(
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[9],
    matrix[10],
    matrix[11],
    matrix[13],
    matrix[14],
    matrix[15]
  );
  const m12 = Matrix3.create(
    matrix[4],
    matrix[6],
    matrix[7],
    matrix[8],
    matrix[10],
    matrix[11],
    matrix[12],
    matrix[14],
    matrix[15]
  );
  const m13 = Matrix3.create(
    matrix[4],
    matrix[5],
    matrix[7],
    matrix[8],
    matrix[9],
    matrix[11],
    matrix[12],
    matrix[13],
    matrix[15]
  );
  const m14 = Matrix3.create(
    matrix[4],
    matrix[5],
    matrix[6],
    matrix[8],
    matrix[9],
    matrix[10],
    matrix[12],
    matrix[13],
    matrix[14]
  );

  const m21 = Matrix3.create(
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[9],
    matrix[10],
    matrix[11],
    matrix[13],
    matrix[14],
    matrix[15]
  );
  const m22 = Matrix3.create(
    matrix[0],
    matrix[2],
    matrix[3],
    matrix[8],
    matrix[10],
    matrix[11],
    matrix[12],
    matrix[14],
    matrix[15]
  );
  const m23 = Matrix3.create(
    matrix[0],
    matrix[1],
    matrix[3],
    matrix[8],
    matrix[9],
    matrix[11],
    matrix[12],
    matrix[13],
    matrix[15]
  );
  const m24 = Matrix3.create(
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[8],
    matrix[9],
    matrix[10],
    matrix[12],
    matrix[13],
    matrix[14]
  );

  const m31 = Matrix3.create(
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[13],
    matrix[14],
    matrix[15]
  );
  const m32 = Matrix3.create(
    matrix[0],
    matrix[2],
    matrix[3],
    matrix[4],
    matrix[6],
    matrix[7],
    matrix[12],
    matrix[14],
    matrix[15]
  );
  const m33 = Matrix3.create(
    matrix[0],
    matrix[1],
    matrix[3],
    matrix[4],
    matrix[5],
    matrix[7],
    matrix[12],
    matrix[13],
    matrix[15]
  );
  const m34 = Matrix3.create(
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[4],
    matrix[5],
    matrix[6],
    matrix[12],
    matrix[13],
    matrix[14]
  );

  const m41 = Matrix3.create(
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[9],
    matrix[10],
    matrix[11]
  );
  const m42 = Matrix3.create(
    matrix[0],
    matrix[2],
    matrix[3],
    matrix[4],
    matrix[6],
    matrix[7],
    matrix[8],
    matrix[10],
    matrix[11]
  );
  const m43 = Matrix3.create(
    matrix[0],
    matrix[1],
    matrix[3],
    matrix[4],
    matrix[5],
    matrix[7],
    matrix[8],
    matrix[9],
    matrix[11]
  );
  const m44 = Matrix3.create(
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[4],
    matrix[5],
    matrix[6],
    matrix[8],
    matrix[9],
    matrix[10]
  );

  const adjoint = create([
    Matrix3.determinant(m11),
    -Matrix3.determinant(m21),
    Matrix3.determinant(m31),
    -Matrix3.determinant(m41),
    -Matrix3.determinant(m12),
    Matrix3.determinant(m22),
    -Matrix3.determinant(m32),
    Matrix3.determinant(m42),
    Matrix3.determinant(m13),
    -Matrix3.determinant(m23),
    Matrix3.determinant(m33),
    -Matrix3.determinant(m43),
    -Matrix3.determinant(m14),
    Matrix3.determinant(m24),
    -Matrix3.determinant(m34),
    Matrix3.determinant(m44),
  ]);

  return adjoint.map((v) => v * (1.0 / determinant(matrix)));
}

export function determinant(matrix: Matrix4): number {
  const a = matrix[0];
  const b = matrix[4];
  const c = matrix[8];
  const d = matrix[12];

  const subMatrix1 = Matrix3.create(
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[9],
    matrix[10],
    matrix[11],
    matrix[13],
    matrix[14],
    matrix[15]
  );

  const subMatrix2 = Matrix3.create(
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[9],
    matrix[10],
    matrix[11],
    matrix[13],
    matrix[14],
    matrix[15]
  );

  const subMatrix3 = Matrix3.create(
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[12],
    matrix[13],
    matrix[15]
  );

  const subMatrix4 = Matrix3.create(
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[9],
    matrix[10],
    matrix[11]
  );

  return (
    a * Matrix3.determinant(subMatrix1) -
    b * Matrix3.determinant(subMatrix2) +
    c * Matrix3.determinant(subMatrix3) -
    d * Matrix3.determinant(subMatrix4)
  );
}

export function multiplyVector3(
  matrix: Matrix4,
  vector: Vector3.Vector3
): Vector4.Vector4 {
  const { x: vx, y: vy, z: vz } = vector;
  const x = matrix[0] * vx + matrix[1] * vy + matrix[2] * vz + matrix[3];
  const y = matrix[4] * vx + matrix[5] * vy + matrix[6] * vz + matrix[7];
  const z = matrix[8] * vx + matrix[9] * vy + matrix[10] * vz + matrix[11];
  const w = matrix[12] * vx + matrix[13] * vy + matrix[14] * vz + matrix[15];
  return Vector4.create(x, y, z, w);
}

export function multiplyVector4(
  matrix: Matrix4,
  vector: Vector4.Vector4
): Vector4.Vector4 {
  const { x: vx, y: vy, z: vz, w: vw } = vector;
  const x = matrix[0] * vx + matrix[1] * vy + matrix[2] * vz + matrix[3] * vw;
  const y = matrix[4] * vx + matrix[5] * vy + matrix[6] * vz + matrix[7] * vw;
  const z = matrix[8] * vx + matrix[9] * vy + matrix[10] * vz + matrix[11] * vw;
  const w =
    matrix[12] * vx + matrix[13] * vy + matrix[14] * vz + matrix[15] * vw;
  return Vector4.create(x, y, z, w);
}

export const multiply = (a: Matrix4, b: Matrix4): Matrix4 => {
  return create([
    a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12],
    a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13],
    a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14],
    a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15],

    a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12],
    a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13],
    a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14],
    a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15],

    a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12],
    a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13],
    a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14],
    a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15],

    a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12],
    a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13],
    a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14],
    a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15],
  ]);
};

export function transpose(matrix: Matrix4): Matrix4 {
  /* eslint-disable prettier/prettier */
  return create([
    matrix[0], matrix[4], matrix[8], matrix[12],
    matrix[1], matrix[5], matrix[9], matrix[13],
    matrix[2], matrix[6], matrix[10], matrix[14],
    matrix[3], matrix[7], matrix[11], matrix[15],
  ])
  /* eslint-enable prettier/prettier */
}
