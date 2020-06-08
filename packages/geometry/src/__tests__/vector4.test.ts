import * as Vector4 from '../vector4';

describe(Vector4.create, () => {
  it('creates a vector with x, y, z, x', () => {
    expect(Vector4.create(1, 2, 3, 4)).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
      w: 4,
    });
  });
});
