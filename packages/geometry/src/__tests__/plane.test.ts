import * as Vector3 from '../vector3';
import * as Plane from '../plane';

describe(Plane.create, () => {
  it('returns plane with defaults', () => {
    const plane = Plane.create();
    expect(plane).toMatchObject({
      normal: Vector3.origin(),
      constant: 0,
    });
  });

  it('merges values', () => {
    const plane = Plane.create({ normal: Vector3.up(), constant: 1 });
    expect(plane).toMatchObject({
      normal: Vector3.up(),
      constant: 1,
    });
  });
});

describe(Plane.distanceToPoint, () => {
  it('returns distance between plane and point', () => {
    const plane = Plane.create({ normal: Vector3.up(), constant: 10 });
    const point = Vector3.scale(100, Vector3.up());

    const distance = Plane.distanceToPoint(plane, point);
    expect(distance).toBeCloseTo(110);
  });
});
