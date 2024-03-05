import * as Angle from '../angle';
import * as Euler from '../euler';
import * as Matrix4 from '../matrix4';
import * as Quaternion from '../quaternion';
import * as Vector3 from '../vector3';

describe(Quaternion.fromJson, () => {
  it('parses json obj', () => {
    const q = Quaternion.fromJson(JSON.stringify(Quaternion.create()));
    expect(q).toEqual(Quaternion.create());
  });

  it('parses json array', () => {
    const q = Quaternion.fromJson('[1, 2, 3, 4]');
    expect(q).toEqual(Quaternion.create({ x: 1, y: 2, z: 3, w: 4 }));
  });
});

describe(Quaternion.normalize, () => {
  it('normalizes the provided quaternion', () => {
    const q = Quaternion.create({ w: 1, x: 2, y: 3, z: 4 });
    const normalized = Quaternion.normalize(q);
    expect(normalized.w).toBeCloseTo(0.1825);
    expect(normalized.x).toBeCloseTo(0.365);
    expect(normalized.y).toBeCloseTo(0.5475);
    expect(normalized.z).toBeCloseTo(0.73);
  });
});

describe(Quaternion.magnitude, () => {
  it('returns the magnitude of the provided quaternion', () => {
    const magnitude = Quaternion.magnitude(
      Quaternion.create({ w: 1, x: 2, y: 3, z: 4 })
    );
    expect(magnitude).toBeCloseTo(5.48);
  });
});

describe(Quaternion.scale, () => {
  it('scales the provided quaternion', () => {
    const q = Quaternion.create({ w: 1, x: 2, y: 3, z: 4 });
    expect(Quaternion.scale(100, q)).toMatchObject(
      Quaternion.create({
        w: 100,
        x: 200,
        y: 300,
        z: 400,
      })
    );
  });
});

describe(Quaternion.fromAxisAngle, () => {
  it('rotates quaternion around axis', () => {
    const q = Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90));
    const m = Matrix4.makeRotation(q);
    const e = Euler.fromRotationMatrix(m);

    expect(e.y).toBeCloseTo(Angle.toRadians(90));
  });
});

describe(Quaternion.fromMatrixRotation, () => {
  it('creates a quaternion from a x-rotation matrix of less than 90 degrees', () => {
    const angle = Angle.toRadians(45);
    const m = Matrix4.makeRotation(
      Quaternion.fromAxisAngle(Vector3.right(), angle)
    );
    const q = Quaternion.fromMatrixRotation(m);
    const expected = Quaternion.create({
      x: Math.sin(angle / 2),
      w: Math.cos(angle / 2),
    });

    expect(q.x).toBeCloseTo(expected.x);
    expect(q.w).toBeCloseTo(expected.w);
  });

  it('creates a quaternion from a x-rotation matrix of over 90 degrees', () => {
    const angle = Angle.toRadians(170);
    const m = Matrix4.makeRotation(
      Quaternion.fromAxisAngle(Vector3.right(), angle)
    );
    const q = Quaternion.fromMatrixRotation(m);
    const expected = Quaternion.create({
      x: Math.sin(angle / 2),
      w: Math.cos(angle / 2),
    });

    expect(q.x).toBeCloseTo(expected.x);
    expect(q.w).toBeCloseTo(expected.w);
  });

  it('creates a quaternion from a y-rotation matrix of over 90 degrees', () => {
    const angle = Angle.toRadians(190);
    const m = Matrix4.makeRotation(
      Quaternion.fromAxisAngle(Vector3.up(), angle)
    );
    const q = Quaternion.fromMatrixRotation(m);
    const expected = Quaternion.create({
      y: Math.sin(angle / 2),
      w: Math.cos(angle / 2),
    });

    expect(q.y).toBeCloseTo(expected.y);
    expect(q.w).toBeCloseTo(expected.w);
  });

  it('creates a quaternion from a z-rotation matrix of over 90 degrees', () => {
    const angle = Angle.toRadians(200);
    const m = Matrix4.makeRotation(
      Quaternion.fromAxisAngle(Vector3.back(), angle)
    );
    const q = Quaternion.fromMatrixRotation(m);
    const expected = Quaternion.create({
      z: Math.sin(angle / 2),
      w: Math.cos(angle / 2),
    });

    expect(q.z).toBeCloseTo(expected.z);
    expect(q.w).toBeCloseTo(expected.w);
  });
});

describe(Quaternion.fromEuler, () => {
  it('creates quaternion from euler xyz angles', () => {
    const e = Euler.create({ y: Angle.toRadians(90) });
    const q = Quaternion.fromEuler(e);

    expect(q).toEqual(
      Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90))
    );
  });

  it('creates quaternion from euler yxz angles', () => {
    const e = Euler.create({ y: Angle.toRadians(90), order: 'yxz' });
    const q = Quaternion.fromEuler(e);

    expect(q).toEqual(
      Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90))
    );
  });

  it('creates quaternion from euler zxy angles', () => {
    const e = Euler.create({ y: Angle.toRadians(90), order: 'zxy' });
    const q = Quaternion.fromEuler(e);

    expect(q).toEqual(
      Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90))
    );
  });

  it('creates quaternion from euler zyx angles', () => {
    const e = Euler.create({ y: Angle.toRadians(90), order: 'zyx' });
    const q = Quaternion.fromEuler(e);

    expect(q).toEqual(
      Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90))
    );
  });

  it('creates quaternion from euler yzx angles', () => {
    const e = Euler.create({ y: Angle.toRadians(90), order: 'yzx' });
    const q = Quaternion.fromEuler(e);

    expect(q).toEqual(
      Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90))
    );
  });

  it('creates quaternion from euler xzy angles', () => {
    const e = Euler.create({ y: Angle.toRadians(90), order: 'xzy' });
    const q = Quaternion.fromEuler(e);

    expect(q).toEqual(
      Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90))
    );
  });
});

describe(Quaternion.isType, () => {
  it('returns true if quaternion', () => {
    expect(Quaternion.isType(Quaternion.create())).toBe(true);
  });

  it('returns false if not quaternion', () => {
    expect(Quaternion.isType('')).toBe(false);
  });
});
