import { toRadians } from './angle';
import * as Point from './point';

/**
 * Represents a 2D transformation matrix.
 *
 * The values of this matrix are meant to represent a 3x3 matrix where the
 * contents are mapped as the following:
 *
 * ```
 * a  b  tx
 * c  d  ty
 * u  v  w
 * ```
 */
export interface Matrix {
  /**
   * Value that affects the positioning along the x axis when scaling or
   * rotating.
   */
  a: number;

  /**
   * Value that affects the positioning along the y axis when rotating or
   * skewing.
   */
  b: number;

  /**
   * Value that affects the positioning along the x axis when rotating or
   * skewing.
   */
  c: number;

  /**
   * Value that affects the positioning along the y axis when scaling or
   * rotating.
   */
  d: number;

  /**
   * The distance to translate along the x axis.
   */
  tx: number;

  /**
   * The distance to translate along the y axis.
   */
  ty: number;
}

/**
 * Creates a new matrix. If arguments are undefined, returns an identity matrix.
 */
export const create = (a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0): Matrix => {
  return { a, b, c, d, tx, ty };
};

/**
 * Returns an identity matrix.
 */
export const identity = (): Matrix => {
  return create();
};

/**
 * Creates a matrix that is translated by the given `tx` and `ty` values.
 */
export const translation = (tx: number, ty: number): Matrix => {
  return translate(tx, ty, identity());
};

/**
 * Creates a matrix that is rotated by the given degrees.
 */
export const rotation = (degrees: number): Matrix => {
  return rotate(degrees, identity());
};

/**
 * Rotates the given matrix by the given degrees.
 */
export const rotate = (degrees: number, matrix: Matrix): Matrix => {
  const radians = toRadians(degrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const a = matrix.a * cos + matrix.c * sin;
  const b = matrix.b * cos + matrix.d * sin;
  const c = matrix.a * -sin + matrix.c * cos;
  const d = matrix.b * -sin + matrix.d * cos;

  return create(a, b, c, d, matrix.tx, matrix.ty);
};

/**
 * Translates the given matrix along the horizontal and vertical axis by the
 * given `dx` and `dy` delta values.
 */
export const translate = (dx: number, dy: number, matrix: Matrix): Matrix => {
  const newTx = matrix.a * dx + matrix.c * dy + matrix.tx;
  const newTy = matrix.b * dx + matrix.d * dy + matrix.ty;
  return create(matrix.a, matrix.b, matrix.c, matrix.d, newTx, newTy);
};

/**
 * Returns the result of applying a geometric transformation of a matrix on the
 * given point.
 */
export const transformPoint = (
  matrix: Matrix,
  pt: Point.Point
): Point.Point => {
  const x = matrix.a * pt.x + matrix.c * pt.y + matrix.tx;
  const y = matrix.b * pt.x + matrix.d * pt.y + matrix.ty;
  return Point.create(x, y);
};
