import * as Point from '../point';

describe(Point.distance, () => {
  const a = Point.create(0, 0);
  const b = Point.create(0, 10);

  it('should return the distance between two points', () => {
    expect(Point.distance(a, b)).toEqual(10);
  });

  it('should always be a positive number', () => {
    expect(Point.distance(b, a)).toEqual(10);
  });
});

describe(Point.isEqual, () => {
  const a = Point.create(0, 0);
  const b = Point.create(15, 10);
  const c = Point.create(15, 10);

  it('should return true when values are the same', () => {
    expect(Point.isEqual(b, c)).toEqual(true);
  });

  it('should return false when values are not the same', () => {
    expect(Point.isEqual(a, b)).toEqual(false);
  });
});

describe(Point.polar, () => {
  it('should convert a pair of polar points into a cartesian point', () => {
    const pt0 = Point.polar(100, 0);
    expect(pt0.x).toBeCloseTo(100, 1);
    expect(pt0.y).toBeCloseTo(0, 1);

    const pt90 = Point.polar(100, 90);
    expect(pt90.x).toBeCloseTo(0, 1);
    expect(pt90.y).toBeCloseTo(100, 1);

    const pt180 = Point.polar(100, 180);
    expect(pt180.x).toBeCloseTo(-100, 1);
    expect(pt180.y).toBeCloseTo(0, 1);

    const pt270 = Point.polar(100, 270);
    expect(pt270.x).toBeCloseTo(0, 1);
    expect(pt270.y).toBeCloseTo(-100, 1);
  });
});

describe(Point.negate, () => {
  it('returns a point with negative components', () => {
    const a = Point.create(1, 2);
    expect(Point.negate(a)).toEqual(Point.create(-1, -2));
  });
});

describe(Point.scale, () => {
  it('returns a point scaled on each dimensions', () => {
    const a = Point.create(1, 2);
    expect(Point.scale(a, 2, 3)).toEqual(Point.create(2, 6));
  });
});
