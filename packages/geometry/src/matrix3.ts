/**
 * A 3x3 matrix. The contents are mapped as follows:
 *
 * ```
 * a  b  c
 * d  e  f
 * g  h  i
 * ```
 */
export interface Matrix3 {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
  i: number;
}

/**
 * Creates a new matrix.
 */
export function create(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number,
  i: number
): Matrix3 {
  return {
    a,
    b,
    c,
    d,
    e,
    f,
    g,
    h,
    i,
  };
}

/**
 * Returns the determinant of the provided matrix.
 */
export function determinant(m: Matrix3): number {
  return (
    m.a * m.e * m.i +
    m.b * m.f * m.g +
    m.c * m.d * m.h -
    m.c * m.e * m.g -
    m.b * m.d * m.i -
    m.a * m.f * m.h
  );
}
