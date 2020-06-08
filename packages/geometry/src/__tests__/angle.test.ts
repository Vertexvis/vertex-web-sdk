import * as Point from '../point';
import * as Angle from '../angle';

describe(Angle.fromPoints, () => {
  it('should return an angle', () => {
    const angle = Angle.fromPoints(Point.create(0, 0), Point.create(10, 0));
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
