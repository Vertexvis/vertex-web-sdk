import * as Angle from './angle';
import * as Quaternion from './quaternion';
import * as Vector3 from './vector3';

/**
 * A type alias representing a 4x4 row-major matrix.
 *
 * The common use-case for 4x4 matrices in 3D computer graphics are for
 * [transformation matrices](https://en.wikipedia.org/wiki/Transformation_matrix).
 * This allows a point in 3D space to be projected onto a 2D screen using
 * transformations such as translation, rotation and scale.
 */
export type Matrix4 = [
  /* eslint-disable prettier/prettier */
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  /* eslint-enable prettier/prettier */
];

/**
 * An object representation of a `Matrix4`, where each value is represented as:
 *
 * ```
 * m11 m12 m13 m14
 * m21 m22 m23 m24
 * m31 m32 m33 m34
 * m41 m42 m43 m44
 * ```
 *
 * `Matrix4` arrays can be converted to an object using {@link toObject}.
 */
export interface Matrix4AsObject {
  m11: number;
  m12: number;
  m13: number;
  m14: number;

  m21: number;
  m22: number;
  m23: number;
  m24: number;

  m31: number;
  m32: number;
  m33: number;
  m34: number;

  m41: number;
  m42: number;
  m43: number;
  m44: number;
}

/**
 * Creates a 4x4 matrix from a set of row-major components.
 */
export function fromValues(
  /* eslint-disable prettier/prettier */
  m11: number, m12: number, m13: number, m14: number,
  m21: number, m22: number, m23: number, m24: number,
  m31: number, m32: number, m33: number, m34: number,
  m41: number, m42: number, m43: number, m44: number,
  /* eslint-enable prettier/prettier */
): Matrix4 {
  /* eslint-disable prettier/prettier */
  return [
    m11, m12, m13, m14,
    m21, m22, m23, m24,
    m31, m32, m33, m34,
    m41, m42, m43, m44,
  ]
  /* eslint-enable prettier/prettier */
}

/**
 * Returns a new [identity matrix](https://en.wikipedia.org/wiki/Identity_matrix).
 */
export function makeIdentity(): Matrix4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/**
 * Returns a matrix with all values as 0.
 */
export function makeZero(): Matrix4 {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

/**
 * Creates a translation matrix.
 *
 * ```
 * 1, 0, 0, 0,
 * 0, 1, 0, 0,
 * 0, 0, 1, 0,
 * x, y, z, 1
 * ```
 *
 * @param translation A vector representing the translation components.
 * @returns A translation matrix.
 */
export function makeTranslation(translation: Vector3.Vector3): Matrix4 {
  const { x, y, z } = translation;
  /* eslint-disable prettier/prettier */
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ];
  /* eslint-enable prettier/prettier */
}

/**
 * Creates a rotation matrix.
 *
 * ```
 * 1-2y²-2z²,    2xy-2zw,    2xz+2yw,    0,
 * 2xy+2zw,      1-2x²-2z²,  2yz-2xw,    0,
 * 2xz-2yw,      2yz+2xw,    1-2x²-2y²,  0,
 * 0,            0,          0,          1,
 * ```
 *
 * @param rotation A quaternion representing the rotation.
 * @see https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion
 * @returns A rotation matrix.
 */
export function makeRotation(rotation: Quaternion.Quaternion): Matrix4 {
  const { x, y, z, w } = rotation;

  const x2 = x + x,
    y2 = y + y,
    z2 = z + z;
  const xx = x * x2,
    xy = x * y2,
    xz = x * z2;
  const yy = y * y2,
    yz = y * z2,
    zz = z * z2;
  const wx = w * x2,
    wy = w * y2,
    wz = w * z2;

  /* eslint-disable prettier/prettier */
  return [
    1 - ( yy + zz ), xy - wz, xz + wy, 0,
    xy + wz, 1 - ( xx + zz ), yz - wx, 0,
    xz - wy, yz + wx, 1 - ( xx + yy ), 0,
    0, 0, 0, 1
  ];
  /* eslint-enable prettier/prettier */
}

/**
 * Creates a scale matrix.
 *
 * ```
 * x, 0, 0, 0,
 * 0, y, 0, 0,
 * 0, 0, z, 0,
 * 0, 0, 0, 1
 * ```
 *
 * @param scale A vector representing the different scale components.
 * @returns A scale matrix.
 */
export function makeScale(scale: Vector3.Vector3): Matrix4 {
  const { x, y, z } = scale;
  /* eslint-disable prettier/prettier */
  return [
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ];
  /* eslint-enable prettier/prettier */
}

/**
 * Creates a matrix that has translation, rotation, and scale applied to it.
 *
 * @param translation The translation applied to the matrix.
 * @param rotation The rotation applied to the matrix.
 * @param scale The scale applied to the matrix.
 * @returns A transformed matrix.
 */
export function makeTRS(
  translation: Vector3.Vector3,
  rotation: Quaternion.Quaternion,
  scale: Vector3.Vector3
): Matrix4 {
  // T is row-major and r is column-major. Why does this work?
  const t = makeTranslation(translation);
  const r = transpose(makeRotation(rotation));
  const s = makeScale(scale);
  return multiply(s, multiply(r, t));
}

/**
 * Returns a matrix that has the basis components (upper left 3x3 matrix) set to
 * the following x, y, and z axis.
 *
 * ```
 * x.x  x.y  x.z  0
 * y.x  y.y  y.z  0
 * z.x  z.y  z.z  0
 * 0    0    0    0
 * ```
 *
 * @param x The x-axis to set.
 * @param y The y-axis to set.
 * @param z The z-axis to set.
 * @returns A matrix with its basis components populated.
 */
export function makeBasis(
  x: Vector3.Vector3,
  y: Vector3.Vector3,
  z: Vector3.Vector3
): Matrix4 {
  /* eslint-disable prettier/prettier */
  return [
    x.x, x.y, x.z, 0,
    y.x, y.y, y.z, 0,
    z.x, z.y, z.z, 0,
    0, 0, 0, 1
  ]
  /* eslint-enable prettier/prettier */
}

/**
 * Creates a matrix used for [perspective
 * projections](https://en.wikipedia.org/wiki/3D_projection#Perspective_projection).
 *
 * The viewing volume is frustum-shaped and defined by the six parameters. Left,
 * right, top, and bottom specify coordinates in the near clipping plane where
 * the frustum edges intersect it, and the near and far parameters define the
 * forward distances of the view volume. The resulting volume can be vertically
 * and horizontally asymmetrical around the center of the near plane.
 *
 * @param left The left coordinate at the near plane.
 * @param right The right coordinate at the near plane.
 * @param top The top coordinate at the near plane.
 * @param bottom The bottom coordinate at the near plane.
 * @param near The near distance.
 * @param far The far distance.
 * @returns A matrix representing a view frustum.
 */
export function makeFrustum(
  left: number,
  right: number,
  top: number,
  bottom: number,
  near: number,
  far: number
): Matrix4 {
  const x = (2 * near) / (right - left);
  const y = (2 * near) / (top - bottom);

  const a = (right + left) / (right - left);
  const b = (top + bottom) / (top - bottom);
  const c = -(far + near) / (far - near);
  const d = (-2 * far * near) / (far - near);

  /* eslint-disable prettier/prettier */
    return [
      x, 0, 0, 0,
      0, y, 0, 0,
      a, b, c, -1,
      0, 0, d, 0
    ];
    /* eslint-enable prettier/prettier */
}

/**
 * Creates a perspective projection matrix.
 *
 * Related to: gluPerspective. The viewing volume is frustum-shaped amd defined
 * by the four parameters. The fovy and aspect ratio are used to compute the
 * positions of the left, right, top, and bottom sides of the viewing volume in
 * the zNear plane. The fovy is the y field-of-view, the angle made by the top
 * and bottom sides of frustum if they were to intersect. The aspect ratio is
 * the width of the frustum divided by its height. Note that the resulting
 * volume is both vertically and horizontally symmetrical around the center of
 * the near plane.
 *
 * @param near The near Z value.
 * @param far The far Z value.
 * @param fovY The field of view.
 * @param aspect The aspect ratio.
 * @returns A matrix.
 */
export function makePerspective(
  near: number,
  far: number,
  fovY: number,
  aspect: number
): Matrix4 {
  const ymax = near * Math.tan(Angle.toRadians(fovY / 2.0));
  const xmax = ymax * aspect;

  const left = -xmax;
  const right = xmax;
  const top = ymax;
  const bottom = -ymax;

  return makeFrustum(left, right, top, bottom, near, far);
}

/**
 * Creates an orthographic projection matrix.
 *
 * Related to: gluOrtho. The viewing volume is cube-shaped and defined by
 * the six parameters. The left and right values represent the coordinates of
 * the vertical clipping planes, top and bottom values represent the coordinates
 * of the horizontal clipping planes, and near and far values represent the
 * coordinates of the depth clipping planes.
 *
 * @param left The coordinate of the left horizontal clipping plane.
 * @param right The coordinate of the right horizontal clipping plane.
 * @param bottom The coordinate of the bottom vertical clipping plane.
 * @param top The coordinate of the top vertical clipping plane.
 * @param near The coordinate of the near depth clipping plane.
 * @param far The coordinate of the far depth clipping plane.
 * @returns A matrix.
 */
export function makeOrthographic(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number
): Matrix4 {
  const w = 1.0 / (right - left);
  const h = 1.0 / (top - bottom);
  const d = 1.0 / (far - near);

  const x = (right + left) * w;
  const y = (top + bottom) * h;
  const z = (far + near) * d;

  /* eslint-disable prettier/prettier */
  return [
    2 * w, 0,     0,      -x,
    0,     2 * h, 0,      -y,
    0,     0,     -2 * d, -z,
    0,     0,     0,      1
  ];
  /* eslint-enable prettier/prettier */
}

/**
 * Matrix becomes a combination of an inverse translation and rotation.
 *
 * Related to: gluLookAt. This creates the inverse of makeLookAtMatrix. The
 * matrix will be an opposite translation from the 'eye' position, and it will
 * rotate things in the opposite direction of the eye-to-center orientation.
 * This is definitely confusing, but the main reason to use this transform is to
 * set up a view matrix for a camera that's looking at a certain point. To
 * achieve the effect of moving the camera somewhere and rotating it so that it
 * points at something, the rest of the world is moved in the opposite direction
 * and rotated in the opposite way around the camera. This way, you get the same
 * effect as moving the actual camera, but all the projection math can still be
 * done with the camera positioned at the origin (which makes it way simpler).
 *
 * @param position The position of the object.
 * @param lookAt The point which the object is looking at.
 * @param up The direction which the object considers up.
 * @returns A matrix.
 */
export function makeLookAtView(
  position: Vector3.Vector3,
  lookAt: Vector3.Vector3,
  up: Vector3.Vector3
): Matrix4 {
  const z = Vector3.normalize(Vector3.subtract(position, lookAt));
  const x = Vector3.normalize(Vector3.cross(up, z));
  const y = Vector3.cross(z, x);

  const dotX = -Vector3.dot(x, position);
  const dotY = -Vector3.dot(y, position);
  const dotZ = -Vector3.dot(z, position);

  /* eslint-disable prettier/prettier */
  return [
    x.x, y.x, z.x, 0,
    x.y, y.y, z.y, 0,
    x.z, y.z, z.z, 0,
    dotX, dotY, dotZ, 1,
  ];
  /* eslint-enable prettier/prettier */
}

/**
 * Matrix becomes a combination of translation and rotation.
 *
 * Matrix becomes a combination of a translation to the position of 'eye' and a
 * rotation matrix which orients an object to point towards 'center' along its
 * z-axis. Use this function if you want an object to look at a point from
 * another point in space.
 *
 * @param position The position of the object.
 * @param lookAt The point which the object is looking at.
 * @param up The direction which the object considers up.
 * @returns A matrix.
 */
export function makeLookAt(
  position: Vector3.Vector3,
  lookAt: Vector3.Vector3,
  up: Vector3.Vector3
): Matrix4 {
  const z = Vector3.normalize(Vector3.subtract(position, lookAt));
  const x = Vector3.normalize(Vector3.cross(up, z));
  const y = Vector3.cross(z, x);

  /* eslint-disable prettier/prettier */
  return [
    x.x, x.y, x.z, 0,
    y.x, y.y, y.z, 0,
    z.x, z.y, z.z, 0,
    position.x, position.y, position.z, 1
  ];
  /* eslint-enable prettier/prettier */
}

/**
 * Returns the inverse of the given matrix. If the determinate of the matrix is
 * zero, then a zero matrix is returned.
 */
export function invert(matrix: Matrix4): Matrix4 {
  const a00 = matrix[0],
    a01 = matrix[1],
    a02 = matrix[2],
    a03 = matrix[3];
  const a10 = matrix[4],
    a11 = matrix[5],
    a12 = matrix[6],
    a13 = matrix[7];
  const a20 = matrix[8],
    a21 = matrix[9],
    a22 = matrix[10],
    a23 = matrix[11];
  const a30 = matrix[12],
    a31 = matrix[13],
    a32 = matrix[14],
    a33 = matrix[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  const det =
    b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return makeZero();
  }
  const oneOverDet = 1 / det;

  return [
    (a11 * b11 - a12 * b10 + a13 * b09) * oneOverDet,
    (a02 * b10 - a01 * b11 - a03 * b09) * oneOverDet,
    (a31 * b05 - a32 * b04 + a33 * b03) * oneOverDet,
    (a22 * b04 - a21 * b05 - a23 * b03) * oneOverDet,

    (a12 * b08 - a10 * b11 - a13 * b07) * oneOverDet,
    (a00 * b11 - a02 * b08 + a03 * b07) * oneOverDet,
    (a32 * b02 - a30 * b05 - a33 * b01) * oneOverDet,
    (a20 * b05 - a22 * b02 + a23 * b01) * oneOverDet,

    (a10 * b10 - a11 * b08 + a13 * b06) * oneOverDet,
    (a01 * b08 - a00 * b10 - a03 * b06) * oneOverDet,
    (a30 * b04 - a31 * b02 + a33 * b00) * oneOverDet,
    (a21 * b02 - a20 * b04 - a23 * b00) * oneOverDet,

    (a11 * b07 - a10 * b09 - a12 * b06) * oneOverDet,
    (a00 * b09 - a01 * b07 + a02 * b06) * oneOverDet,
    (a31 * b01 - a30 * b03 - a32 * b00) * oneOverDet,
    (a20 * b03 - a21 * b01 + a22 * b00) * oneOverDet,
  ];
}

/**
 * Returns a rotation matrix looking from position towards target and oriented
 * by an up vector.
 *
 * @param m The matrix to transform.
 * @param position The point from which to look at target.
 * @param target The point to look at.
 * @param up The orientation.
 * @returns A rotation matrix.
 */
export function lookAt(
  m: Matrix4,
  position: Vector3.Vector3,
  target: Vector3.Vector3,
  up: Vector3.Vector3
): Matrix4 {
  let z = Vector3.subtract(position, target);
  if (Vector3.magnitudeSquared(z) === 0) {
    z = { ...z, z: 1 };
  }
  z = Vector3.normalize(z);

  let x = Vector3.cross(up, z);
  if (Vector3.magnitudeSquared(x) === 0) {
    if (Math.abs(up.z) === 1) {
      z = { ...z, x: z.x + 0.0001 };
    } else {
      z = { ...z, z: z.z + 0.0001 };
    }

    z = Vector3.normalize(z);
    x = Vector3.cross(up, z);
  }
  x = Vector3.normalize(x);

  const y = Vector3.cross(z, x);

  const res: Matrix4 = [...m];
  /* eslint-disable prettier/prettier */
  res[0] = x.x; res[1] = x.y; res[2] = x.z;
  res[4] = y.x; res[5] = y.y; res[6] = y.z;
  res[8] = z.x; res[9] = z.y; res[10] = z.z;
  /* eslint-enable prettier/prettier */
  return res;
}

/**
 * Returns a post-multiplied matrix equal to ab.
 */
export function multiply(a: Matrix4, b: Matrix4): Matrix4 {
  const result = makeIdentity();

  // Consider each row i in the final matrix
  for (let i = 0; i < 4; i++) {
    // Consider each column j in the final matrix
    for (let j = 0; j < 4; j++) {
      // Calculate the value at row i and column j
      let value = 0;

      for (let k = 0; k < 4; k++) {
        // Calculate (ik + kj) and add it to the value
        value += a[i * 4 + k] * b[k * 4 + j];
      }

      const positionInResultingMatrix = 4 * i + j;
      result[positionInResultingMatrix] = value;
    }
  }

  return result;
}

/**
 * Returns the [transpose](https://en.wikipedia.org/wiki/Transpose) of the given
 * matrix.
 */
export function transpose(matrix: Matrix4): Matrix4 {
  /* eslint-disable prettier/prettier */
  return [
    matrix[0], matrix[4], matrix[8], matrix[12],
    matrix[1], matrix[5], matrix[9], matrix[13],
    matrix[2], matrix[6], matrix[10], matrix[14],
    matrix[3], matrix[7], matrix[11], matrix[15],
  ];
  /* eslint-enable prettier/prettier */
}

/**
 * Multiplies the columns of a row-major matrix by the given vector.
 */
export function scale(matrix: Matrix4, scale: Vector3.Vector3): Matrix4 {
  const { x, y, z } = scale;
  const m: Matrix4 = [...matrix];
  /* eslint-disable prettier/prettier */
  m[0] *= x; m[1] *= x; m[2] *= x; m[3] *= x;
  m[4] *= y; m[5] *= y; m[6] *= y; m[7] *= y;
  m[8] *= z; m[9] *= z; m[10] *= z; m[11] *= z;
  /* eslint-enable prettier/prettier */
  return m;
}

/**
 * Sets the position of the matrix given as the first parameter
 * to the position of the matrix given as the second parameter.
 * Both matrices should have row-major format.
 */
export function position(
  originalMatrix: Matrix4,
  matrixWithDesiredPosition: Matrix4
): Matrix4 {
  const m: Matrix4 = [...originalMatrix];
  m[12] = matrixWithDesiredPosition[12];
  m[13] = matrixWithDesiredPosition[13];
  m[14] = matrixWithDesiredPosition[14];
  return m;
}

/**
 * Returns true if the matrix is an identity matrix.
 */
export function isIdentity(matrix: Matrix4): boolean {
  const identity = makeIdentity();

  return matrix.every((v, i) => v === identity[i]);
}

/**
 * Returns an object representation of a `Matrix4`.
 */
export function toObjectColumnMajor(m: Matrix4): Matrix4AsObject {
  /* eslint-disable prettier/prettier */
  return {
    m11: m[0], m12: m[4], m13: m[8], m14: m[12],
    m21: m[1], m22: m[5], m23: m[9], m24: m[13],
    m31: m[2], m32: m[6], m33: m[10], m34: m[14],
    m41: m[3], m42: m[7], m43: m[11], m44: m[15],
  }
  /* eslint-enable prettier/prettier */
}

/**
 * Returns an object representation of a `Matrix4`.
 */
export function toObjectRowMajor(m: Matrix4): Matrix4AsObject {
  /* eslint-disable prettier/prettier */
  return {
    m11: m[0], m12: m[1], m13: m[2], m14: m[3],
    m21: m[4], m22: m[5], m23: m[6], m24: m[7],
    m31: m[8], m32: m[9], m33: m[10], m34: m[11],
    m41: m[12], m42: m[13], m43: m[14], m44: m[15],
  }
  /* eslint-enable prettier/prettier */
}

/**
 * A type guard to check if `obj` is of type `Matrix4`.
 */
export function isType(obj: unknown): obj is Matrix4 {
  return Array.isArray(obj) && obj.length === 16;
}
