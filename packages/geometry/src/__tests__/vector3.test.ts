import * as Vector3 from '../vector3';
import * as Angle from '../angle';

describe(Vector3.create, () => {
  it('creates a vector with x, y, z', () => {
    expect(Vector3.create(1, 2, 3)).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
    });
  });
});

describe(Vector3.fromArray, () => {
  it('creates a vector from an array', () => {
    expect(Vector3.fromArray([1, 2, 3])).toEqual(Vector3.create(1, 2, 3));
  });
});

describe(Vector3.toArray, () => {
  it('returns a vector as an array', () => {
    expect(Vector3.toArray(Vector3.create(1, 2, 3))).toEqual([1, 2, 3]);
  });
});

describe(Vector3.normalize, () => {
  it('returns a normalized vector', () => {
    const result = Vector3.normalize(Vector3.create(1, 0, 0));
    expect(result).toEqual(Vector3.create(1, 0, 0));
  });
});

describe(Vector3.magnitude, () => {
  it('returns the length of the vector', () => {
    expect(Vector3.magnitude(Vector3.create(3, 3, 3))).toEqual(Math.sqrt(27));
  });
});

describe(Vector3.add, () => {
  it('returns the sum of two vectors', () => {
    const result = Vector3.add(
      Vector3.create(1, 2, 3),
      Vector3.create(1, 2, 3)
    );
    expect(result).toEqual(Vector3.create(2, 4, 6));
  });
});

describe(Vector3.subtract, () => {
  it('returns a vector of b subtracted from a', () => {
    const result = Vector3.subtract(
      Vector3.create(3, 4, 5),
      Vector3.create(1, 2, 3)
    );
    expect(result).toEqual(Vector3.create(2, 2, 2));
  });
});

describe(Vector3.dot, () => {
  it('returns the dot product of two vectors', () => {
    const result = Vector3.dot(
      Vector3.create(1, 2, 3),
      Vector3.create(2, 3, 4)
    );
    expect(result).toEqual(20);
  });
});

describe(Vector3.angleTo, () => {
  it('calculates the angle between two vectors', () => {
    const angle = Vector3.angleTo(
      Vector3.create(1, 1, 1),
      Vector3.create(1, 2, 3)
    );
    expect(angle).toEqual(0.3875966866551805);
  });
});

describe(Vector3.distance, () => {
  it('calculates euclidean distance between two vectors', () => {
    expect(
      Vector3.distance(Vector3.create(0, 0, 0), Vector3.create(0, 4, 0))
    ).toEqual(4);
    // https://en.wikipedia.org/wiki/Pythagorean_quadruple#Primitive_Pythagorean_quadruples_with_small_norm
    expect(
      Vector3.distance(Vector3.origin(), Vector3.create(2, 10, 11))
    ).toEqual(15);
    expect(Vector3.distance(Vector3.origin(), Vector3.create(1, 2, 2))).toEqual(
      3
    );
  });
});

describe(Vector3.isEqual, () => {
  it('returns true if all components are equal values', () => {
    const a = Vector3.create(1, 2, 3);
    const b = Vector3.create(1, 2, 3);
    expect(Vector3.isEqual(a, b)).toEqual(true);
  });

  it('returns false if all components are equal values', () => {
    const a = Vector3.create(1, 2, 3);
    const b = Vector3.create(4, 5, 6);
    expect(Vector3.isEqual(a, b)).toEqual(false);
  });
});

describe(Vector3.isValid, () => {
  it('returns true if all components are numeric', () => {
    const a = Vector3.create(1, 2, 3);
    expect(Vector3.isValid(a)).toEqual(true);
  });

  it('returns false if a component is NaN', () => {
    const a = Vector3.create(1, 2, NaN);
    expect(Vector3.isValid(a)).toEqual(false);
  });

  it('returns false if a component is non-finite', () => {
    const a = Vector3.create(1, 2, Number.POSITIVE_INFINITY);
    expect(Vector3.isValid(a)).toEqual(false);
  });
});

describe(Vector3.multiply, () => {
  it('returns a vector with each component multiplied by the given vector', () => {
    const a = Vector3.create(2, 3, 4);
    const b = Vector3.create(2, 3, 4);
    expect(Vector3.multiply(a, b)).toEqual(Vector3.create(4, 9, 16));
  });
});

describe(Vector3.rotateAboutAxis, () => {
  it('returns a vector that is rotated around an origin point', () => {
    const radians = Angle.toRadians(90);
    const vector = Vector3.up();
    const axis = Vector3.forward();
    const origin = Vector3.origin();
    const rotated = Vector3.rotateAboutAxis(radians, vector, axis, origin);
    expect(rotated.x).toBeCloseTo(1, 5);
    expect(rotated.y).toBeCloseTo(0, 5);
    expect(rotated.z).toBeCloseTo(0, 5);
  });

  it('returns input vector if rotation is 0', () => {
    const radians = Angle.toRadians(0);
    const vector = Vector3.up();
    const axis = Vector3.forward();
    const origin = Vector3.origin();
    const rotated = Vector3.rotateAboutAxis(radians, vector, axis, origin);
    expect(rotated).toEqual(vector);
  });
});

describe(Vector3.cross, () => {
  it('returns the cross product of two vectors', () => {
    const a = Vector3.right();
    const b = Vector3.forward();
    const result = Vector3.cross(a, b);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(1, 5);
    expect(result.z).toBeCloseTo(0, 5);
  });
});
