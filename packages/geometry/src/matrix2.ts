import * as Point from './point';

/**
 * A 2x2 matrix
 */
export interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
}

/**
 * Creates a new matrix.
 */
export function create(a: Point.Point, b: Point.Point): Matrix;

export function create(a: number, b: number, c: number, d: number): Matrix;

export function create(...args: any[]): Matrix {
  if (args.length === 2) {
    return {
      a: args[0].x || 0,
      b: args[0].y || 0,
      c: args[1].x || 0,
      d: args[1].y || 0,
    };
  } else {
    return {
      a: args[0] || 0,
      b: args[1] || 0,
      c: args[2] || 0,
      d: args[3] || 0,
    };
  }
}

/**
 * Returns the determinant of the provided matrix.
 */
export function determinant(matrix: Matrix): number {
  return matrix.a * matrix.d - matrix.b * matrix.c;
}

/**
 * Returns the dot product of the two vectors represented in this matrix.
 */
export function dot(matrix: Matrix): number {
  return matrix.a * matrix.c + matrix.b * matrix.d;
}
