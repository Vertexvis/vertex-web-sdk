import * as Matrix4 from '../matrix4';
import * as Quaternion from '../quaternion';
import * as Vector3 from '../vector3';
import * as Angle from '../angle';
import * as Euler from '../euler';

const camera = {
  position: Vector3.create(0, 1, 1),
  lookAt: Vector3.create(0, 0, 0),
  up: Vector3.create(0, 1, 0),
};

describe(Matrix4.fromObject, () => {
  it('returns Matrix4 from object representation', () => {
    /* eslint-disable prettier/prettier */
    const obj = Matrix4.toObject(Matrix4.fromValues(
      1, 1, 1, 1,
      2, 2, 2, 2,
      3, 3, 3, 3,
      4, 4, 4, 4,
    ));
    /* eslint-enable prettier/prettier */
    const m = Matrix4.fromObject(obj);

    /* eslint-disable prettier/prettier */
    expect(m).toEqual([
      1, 2, 3, 4,
      1, 2, 3, 4,
      1, 2, 3, 4,
      1, 2, 3, 4,
    ])
    /* eslint-enable prettier/prettier */
  });
});

describe(Matrix4.makeZero, () => {
  it('returns zero matrix', () => {
    /* eslint-disable prettier/prettier */
    expect(Matrix4.makeZero()).toEqual([
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0
    ])
    /* eslint-enable prettier/prettier */
  });
});

describe(Matrix4.makeTranslation, () => {
  it('creates matrix with translation components', () => {
    const m = Matrix4.makeTranslation(Vector3.create(1, 2, 3));
    /* eslint-disable prettier/prettier */
    expect(m).toEqual([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 2, 3, 1,
    ])
    /* eslint-enable prettier/prettier */
  });
});

describe(Matrix4.makeRotation, () => {
  it('creates matrix with rotation components', () => {
    const q = Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90));
    const m = Matrix4.makeRotation(q);
    const e = Euler.fromRotationMatrix(m, 'xyz');
    expect(e.y).toBeCloseTo(-Angle.toRadians(90));
  });
});

describe(Matrix4.makeRotationAxis, () => {
  it('creates a rotation matrix from axis and angle', () => {
    const matrix = Matrix4.makeRotationAxis(Vector3.up(), Angle.toRadians(90));
    const pt = Vector3.transformMatrix(Vector3.create(1, 0, 0), matrix);
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(0);
    expect(pt.z).toBeCloseTo(-1);
  });
});

describe(Matrix4.makeBasis, () => {
  it('creates a basis matrix', () => {
    const x = { x: 1, y: 2, z: 3 };
    const y = { x: 11, y: 22, z: 33 };
    const z = { x: 111, y: 222, z: 333 };
    const matrix = Matrix4.makeBasis(x, y, z);
    /* eslint-disable prettier/prettier */
    expect(matrix).toEqual([
      1,   2,   3,   0,
      11,  22,  33,  0,
      111, 222, 333, 0,
      0,   0,   0,   1
    ])
    /* eslint-enable prettier/prettier */
  });
});

describe(Matrix4.makeScale, () => {
  it('creates matrix with scale components', () => {
    const m = Matrix4.makeScale(Vector3.create(1, 2, 3));
    /* eslint-disable prettier/prettier */
    expect(m).toEqual([
      1, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 3, 0,
      0, 0, 0, 1,
    ])
    /* eslint-enable prettier/prettier */
  });
});

describe(Matrix4.makeTRS, () => {
  it('returns matrix with translation, rotation and scale multiplied', () => {
    const t = Vector3.create(10, 20, 30);
    const r = Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(90));
    const s = Vector3.create(1, 2, 3);
    const m = Matrix4.makeTRS(t, r, s);

    const tt = Vector3.fromMatrixPosition(m);
    const rr = Euler.fromRotationMatrix(m, 'xyz');
    const ss = Vector3.fromMatrixScale(m);

    expect(tt).toEqual(t);
    expect(rr.y).toBeCloseTo(-Angle.toRadians(90));
    expect(ss).toEqual(s);
  });
});

describe(Matrix4.makePerspective, () => {
  it('returns projection matrix', () => {
    const m = Matrix4.toObject(Matrix4.makePerspective(1, 2, 90, 1));

    expect(m.m11).toBeCloseTo(1);
    expect(m.m22).toBeCloseTo(1);
    expect(m.m33).toBe(-3);
    expect(m.m34).toBe(-4);
    expect(m.m43).toBe(-1);
  });
});

describe(Matrix4.makeLookAtView, () => {
  it('returns view matrix that looks at target', () => {
    const cosRotation = Math.cos(Angle.toRadians(45));
    const sinRotation = Math.sin(Angle.toRadians(45));
    const m = Matrix4.toObject(
      Matrix4.makeLookAtView(camera.position, camera.lookAt, camera.up)
    );

    expect(m.m11).toBe(1);
    expect(m.m22).toBeCloseTo(cosRotation);
    expect(m.m23).toBeCloseTo(-sinRotation);
    expect(m.m32).toBeCloseTo(sinRotation);
    expect(m.m33).toBeCloseTo(cosRotation);
    expect(m.m34).toBeCloseTo(-1 * cosRotation + -1 * sinRotation);
    expect(m.m44).toBe(1);
  });
});

describe(Matrix4.makeLookAt, () => {
  it('returns matrix that looks at target', () => {
    const cosRotation = Math.cos(Angle.toRadians(45));
    const sinRotation = Math.sin(Angle.toRadians(45));
    const m = Matrix4.toObject(
      Matrix4.makeLookAt(camera.position, camera.lookAt, camera.up)
    );

    expect(m.m11).toBe(1);
    expect(m.m22).toBeCloseTo(cosRotation);
    expect(m.m32).toBeCloseTo(-sinRotation);
    expect(m.m23).toBeCloseTo(sinRotation);
    expect(m.m33).toBeCloseTo(cosRotation);
    expect(m.m34).toBeCloseTo(camera.position.z);
    expect(m.m44).toBe(1);
  });
});

describe(Matrix4.invert, () => {
  it('returns the inverse of a provided matrix', () => {
    /* eslint-disable prettier/prettier */
    const m = Matrix4.fromValues(
      1, 1, 1, -1,
      1, 1, -1, 1,
      1, -1, 1, 1,
      -1, 1, 1, 1,
    );

    expect(Matrix4.invert(m)).toEqual([
      1 / 4, 1 / 4, 1 / 4, -1 / 4,
      1 / 4, 1 / 4, -1 / 4, 1 / 4,
      1 / 4, -1 / 4, 1 / 4, 1 / 4,
      -1 / 4, 1 / 4, 1 / 4, 1 / 4,
    ]);
    /* eslint-enable prettier/prettier */
  });
});

describe(Matrix4.multiply, () => {
  it('returns the result of multiplying two matrices', () => {
    /* eslint-disable prettier/prettier */
    const matrix1 = Matrix4.fromValues(
      1, 1, 1, 1,
      2, 2, 2, 2,
      3, 3, 3, 3,
      4, 4, 4, 4,
    );
    const matrix2 = Matrix4.fromValues(
      4, 4, 4, 4,
      3, 3, 3, 3,
      2, 2, 2, 2,
      1, 1, 1, 1,
    );

    expect(Matrix4.multiply(matrix1, matrix2)).toEqual([
      10, 20, 30, 40,
      10, 20, 30, 40,
      10, 20, 30, 40,
      10, 20, 30, 40,
    ]);
    /* eslint-enable prettier/prettier */
  });
});

describe(Matrix4.lookAt, () => {
  it('rotate towards target', () => {
    const i = Matrix4.makeIdentity();
    const m = Matrix4.lookAt(
      i,
      Vector3.origin(),
      Vector3.right(),
      Vector3.up()
    );
    const r = Euler.fromRotationMatrix(m);

    expect(r.y).toBeCloseTo(-Angle.toRadians(90));
  });
});

describe(Matrix4.scale, () => {
  it('scales components', () => {
    const t = Matrix4.makeScale(Vector3.create(10, 10, 10));
    const s = Matrix4.scale(t, Vector3.create(2, 2, 2));

    const tt = Vector3.fromMatrixScale(s);
    expect(tt).toEqual(Vector3.create(20, 20, 20));
  });
});

describe(Matrix4.transpose, () => {
  it('swaps matrix values', () => {
    /* eslint-disable prettier/prettier */
      const matrix = Matrix4.fromValues(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16
      );

      const transposed = Matrix4.transpose(matrix);

      expect(transposed).toEqual([
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16
      ]);
      /* eslint-enable prettier/prettier */
  });
});

describe(Matrix4.toObject, () => {
  it('converts matrix to row major', () => {
    /* eslint-disable prettier/prettier */
      const matrix = Matrix4.fromValues(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16
      );

      const values = Matrix4.toObject(matrix);
      expect(values).toMatchObject({
        m11: 1, m12: 2, m13: 3, m14: 4,
        m21: 5, m22: 6, m23: 7, m24: 8,
        m31: 9, m32: 10, m33: 11, m34: 12,
        m41: 13, m42: 14, m43: 15, m44: 16
      })
      /* eslint-enable prettier/prettier */
  });
});
