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

describe(Quaternion.fromAxisAngle, () => {
  it('rotates quaternion around axis', () => {
    const q = Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90));
    const m = Matrix4.makeRotation(q);
    const e = Euler.fromRotationMatrix(m);

    expect(e.y).toBeCloseTo(Angle.toRadians(90));
  });
});

describe(Quaternion.fromMatrixRotation, () => {
  it('rotates quaternion around axis', () => {
    const m = Matrix4.makeIdentity();
    const q = Quaternion.fromMatrixRotation(m);

    expect(q).toEqual(Quaternion.create());
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
