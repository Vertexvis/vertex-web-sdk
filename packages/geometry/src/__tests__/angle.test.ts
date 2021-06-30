import * as Point from '../point';
import * as Angle from '../angle';

describe(Angle.fromPoints, () => {
  it('should return 0', () => {
    const angle = Angle.fromPoints(Point.create(0, 0), Point.create(1, 0));
    expect(angle).toBeCloseTo(0);
  });

  it('should return PI', () => {
    const angle = Angle.fromPoints(Point.create(0, 0), Point.create(-1, 0));
    expect(angle).toBeCloseTo(Math.PI);
  });

  it('should return Math.PI / 2', () => {
    const angle = Angle.fromPoints(Point.create(0, 0), Point.create(0, 1));
    expect(angle).toBeCloseTo(Math.PI / 2);
  });

  it('should return -Math.PI / 2', () => {
    const angle = Angle.fromPoints(Point.create(0, 0), Point.create(0, -1));
    expect(angle).toBeCloseTo(-Math.PI / 2);
  });
});

describe(Angle.fromPointsInDegrees, () => {
  it('should return an angle', () => {
    const angle = Angle.fromPointsInDegrees(
      Point.create(0, 0),
      Point.create(10, 0)
    );
    expect(angle).toEqual(90);
  });
});

describe(Angle.toDegrees, () => {
  it('should convert degrees to radians', () => {
    const radians = Angle.toRadians(180);
    expect(radians).toEqual(Math.PI);
  });
});

describe(Angle.toRadians, () => {
  it('should convert radians to degrees', () => {
    const degrees = Angle.toDegrees(Math.PI);
    expect(degrees).toEqual(180);
  });
});
