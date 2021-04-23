import * as Matrix4 from '../matrix4';
import * as Vector3 from '../vector3';
import * as Vector4 from '../vector4';

describe(Matrix4.create, () => {
  it('creates 4 dimensional matrix with list', () => {
    const values = new Array(16).fill(1);
    expect(Matrix4.create(values)).toEqual(values);
  });

  it('throws exception when length of array passed != 16', () => {
    expect(() => {
      Matrix4.create([]);
    }).toThrow(Error);
  });
});

describe(Matrix4.multiplyVector3, () => {
  it('returns correct value given a Matrix4 and Vector3', () => {
    const values = new Array(16).fill(1);
    expect(
      Matrix4.multiplyVector3(Matrix4.create(values), Vector3.create(2, 2, 2))
    ).toEqual(Vector4.create(7, 7, 7, 7));
  });
});

describe(Matrix4.multiplyVector4, () => {
  it('returns correct value given a Matrix4 and Vector3', () => {
    const values = new Array(16).fill(1);
    expect(
      Matrix4.multiplyVector4(
        Matrix4.create(values),
        Vector4.create(2, 2, 2, 2)
      )
    ).toEqual(Vector4.create(8, 8, 8, 8));
  });
});

describe(Matrix4.inverse, () => {
  it('returns the inverse of a provided matrix', () => {
    const matrix = Matrix4.create([
      1,
      1,
      1,
      -1,
      1,
      1,
      -1,
      1,
      1,
      -1,
      1,
      1,
      -1,
      1,
      1,
      1,
    ]);

    expect(Matrix4.inverse(matrix)).toEqual([
      1 / 4,
      1 / 4,
      1 / 4,
      -1 / 4,
      1 / 4,
      1 / 4,
      -1 / 4,
      1 / 4,
      1 / 4,
      -1 / 4,
      1 / 4,
      1 / 4,
      -1 / 4,
      1 / 4,
      1 / 4,
      1 / 4,
    ]);
  });
});

describe(Matrix4.determinant, () => {
  it('returns the correct determinant of a matrix', () => {
    const matrix = Matrix4.create([
      1,
      1,
      1,
      -1,
      1,
      1,
      -1,
      1,
      1,
      -1,
      1,
      1,
      -1,
      1,
      1,
      1,
    ]);

    expect(Matrix4.determinant(matrix)).toEqual(-16);
  });
});

describe(Matrix4.multiply, () => {
  it('returns the result of multiplying two matrices', () => {
    const matrix1 = Matrix4.create([
      1,
      1,
      1,
      1,
      2,
      2,
      2,
      2,
      3,
      3,
      3,
      3,
      4,
      4,
      4,
      4,
    ]);
    const matrix2 = Matrix4.create([
      4,
      4,
      4,
      4,
      3,
      3,
      3,
      3,
      2,
      2,
      2,
      2,
      1,
      1,
      1,
      1,
    ]);

    expect(Matrix4.multiply(matrix1, matrix2)).toEqual([
      10,
      10,
      10,
      10,
      20,
      20,
      20,
      20,
      30,
      30,
      30,
      30,
      40,
      40,
      40,
      40,
    ]);
  });
});
