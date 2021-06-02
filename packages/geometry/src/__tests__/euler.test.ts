import * as Euler from '../euler';
import * as Quaternion from '../quaternion';
import * as Vector3 from '../vector3';
import * as Angle from '../angle';
import * as Matrix4 from '../matrix4';

describe(Euler.fromRotationMatrix, () => {
  const quat = Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90));
  const m = Matrix4.makeRotation(quat);

  it('returns xyz euler', () => {
    const euler90 = Euler.fromRotationMatrix(m, 'xyz');
    expect(euler90.y).toBeCloseTo(-Angle.toRadians(90));
  });

  it('returns yxz euler', () => {
    const euler90 = Euler.fromRotationMatrix(m, 'yxz');
    expect(euler90.y).toBeCloseTo(-Angle.toRadians(90));
  });

  it('returns zxy euler', () => {
    const euler = Euler.fromRotationMatrix(m, 'zxy');
    expect(euler.y).toBeCloseTo(-Angle.toRadians(90));
  });

  it('returns zyx euler', () => {
    const euler = Euler.fromRotationMatrix(m, 'zyx');
    expect(euler.y).toBeCloseTo(-Angle.toRadians(90));
  });

  it('returns yzx euler', () => {
    const euler = Euler.fromRotationMatrix(m, 'yzx');
    expect(euler.y).toBeCloseTo(-Angle.toRadians(90));
  });

  it('returns zxy euler', () => {
    const euler = Euler.fromRotationMatrix(m, 'zxy');
    expect(euler.y).toBeCloseTo(-Angle.toRadians(90));
  });

  it('returns yzw euler', () => {
    const euler = Euler.fromRotationMatrix(m, 'yzx');
    expect(euler.y).toBeCloseTo(-Angle.toRadians(90));
  });

  it('returns xzy euler', () => {
    const euler = Euler.fromRotationMatrix(m, 'xzy');
    expect(euler.y).toBeCloseTo(-Angle.toRadians(90));
  });
});

describe(Euler.fromJson, () => {
  it('parses obj', () => {
    expect(
      Euler.fromJson(JSON.stringify({ x: 0, y: 0, z: 0, order: 'xyz' }))
    ).toEqual({
      x: 0,
      y: 0,
      z: 0,
      order: 'xyz',
    });
  });

  it('parses array', () => {
    expect(Euler.fromJson('[1, 2, 3, "xyz"]')).toEqual({
      x: 1,
      y: 2,
      z: 3,
      order: 'xyz',
    });
  });
});

describe(Euler.isType, () => {
  it('returns true if correct type', () => {
    expect(Euler.isType(Euler.create())).toBe(true);
  });

  it('returns false if not correct type', () => {
    expect(Euler.isType('')).toBe(false);
  });
});
