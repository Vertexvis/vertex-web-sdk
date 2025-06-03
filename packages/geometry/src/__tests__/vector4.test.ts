import * as Vector4 from '../vector4';

describe(Vector4.create, () => {
  it('creates a vector with x, y, z, w', () => {
    expect(Vector4.create({ x: 1, y: 2, z: 3, w: 4 })).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
      w: 4,
    });
  });

  it('creates a origin vector if no arg', () => {
    expect(Vector4.create()).toMatchObject({ x: 0, y: 0, z: 0, w: 0 });
  });
});

describe(Vector4.fromJson, () => {
  it('parses json obj', () => {
    const v = Vector4.fromJson(JSON.stringify({ x: 1, y: 2, z: 3, w: 4 }));
    expect(v).toEqual(Vector4.create({ x: 1, y: 2, z: 3, w: 4 }));
  });

  it('parses json array', () => {
    const v = Vector4.fromJson('[1, 2, 3, 4]');
    expect(v).toEqual(Vector4.create({ x: 1, y: 2, z: 3, w: 4 }));
  });
});
