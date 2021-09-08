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

    const pt90 = Point.polar(100, Math.PI / 2);
    expect(pt90.x).toBeCloseTo(0, 1);
    expect(pt90.y).toBeCloseTo(100, 1);

    const pt180 = Point.polar(100, Math.PI);
    expect(pt180.x).toBeCloseTo(-100, 1);
    expect(pt180.y).toBeCloseTo(0, 1);

    const pt270 = Point.polar(100, -Math.PI / 2);
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

describe(Point.lerp, () => {
  const pt1 = Point.create(1, 1);
  const pt2 = Point.create(2, 2);

  it('returns a point between A and B', () => {
    expect(Point.lerp(pt1, pt2, 0.5)).toEqual(Point.create(1.5, 1.5));
  });

  it('clamps to 0', () => {
    expect(Point.lerp(pt1, pt2, -1)).toEqual(pt1);
  });

  it('clamps to 1', () => {
    expect(Point.lerp(pt1, pt2, 2)).toEqual(pt2);
  });
});

describe(Point.fromJson, () => {
  it('parses json obj', () => {
    const v = Point.fromJson(JSON.stringify({ x: 1, y: 2 }));
    expect(v).toEqual(Point.create(1, 2));
  });

  it('parses json array', () => {
    const v = Point.fromJson('[1, 2]');
    expect(v).toEqual(Point.create(1, 2));
  });
});
