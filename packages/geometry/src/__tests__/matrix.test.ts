import * as Point from '../point';
import * as Matrix from '../matrix';

const matrix = Matrix.identity();

describe(Matrix.translation, () => {
  it('returns a translation matrix', () => {
    const matrix = Matrix.translation(2, 3);
    const result = Matrix.transformPoint(matrix, Point.create(1, 1));
    expect(result).toEqual(Point.create(3, 4));
  });
});

describe(Matrix.rotation, () => {
  it('returns a translation matrix', () => {
    const matrix = Matrix.rotation(90);
    const result = Matrix.transformPoint(matrix, Point.create(0, -10));
    expect(result.x).toBeCloseTo(10, 1);
    expect(result.y).toBeCloseTo(0, 1);
  });
});

describe(Matrix.translate, () => {
  it('transforms the matrix by dx and dy', () => {
    const translated = Matrix.translate(10, 10, matrix);
    const pt = Matrix.transformPoint(translated, Point.create(0, 0));
    expect(pt).toEqual(Point.create(10, 10));
  });
});

describe(Matrix.rotate, () => {
  it('rotates matrix by degrees', () => {
    const rotated = Matrix.rotate(90, matrix);
    const pt = Point.create(0, -10);
    const result = Matrix.transformPoint(rotated, pt);
    expect(result.x).toBeCloseTo(10, 1);
    expect(result.y).toBeCloseTo(0, 1);
  });
});
