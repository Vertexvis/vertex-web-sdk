import * as Matrix2 from '../matrix2';
import * as Point from '../point';

describe(Matrix2.create, () => {
  it('creates a matrix from points', () => {
    expect(Matrix2.create(Point.create(1, 1), Point.create(2, 2))).toEqual({
      a: 1,
      b: 1,
      c: 2,
      d: 2,
    });
  });

  it('creates a matrix from values', () => {
    expect(Matrix2.create(1, 2, 3, 4)).toEqual({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    });
  });

  it('returns an emtpy matrix if nothing is passed', () => {
    expect(Matrix2.create()).toEqual({
      a: 0,
      b: 0,
      c: 0,
      d: 0,
    });
  });
});

describe(Matrix2.determinant, () => {
  it('returns the correct determinant', () => {
    expect(Matrix2.determinant(Matrix2.create(1, 2, 3, 4))).toEqual(-2);
  });
});

describe(Matrix2.dot, () => {
  it('returns the correct dot product', () => {
    expect(Matrix2.dot(Matrix2.create(1, 2, 3, 4))).toEqual(11);
  });
});
