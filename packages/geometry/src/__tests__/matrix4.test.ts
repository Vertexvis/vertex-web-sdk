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
