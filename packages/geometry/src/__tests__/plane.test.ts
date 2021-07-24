import * as Vector3 from '../vector3';
import * as Plane from '../plane';
import * as Line3 from '../line3';

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

describe(Plane.intersectLine, () => {
  const plane = Plane.create({ normal: { x: 0, y: 0, z: -1 }, constant: 10 });

  it('returns point intersecting with plane', () => {
    const line = Line3.create({
      start: Vector3.create(0, 0, 0),
      end: Vector3.create(0, 0, 20),
    });
    const pt = Plane.intersectLine(plane, line);
    expect(pt).toEqual(Vector3.create(0, 0, 10));
  });

  it('returns undefined if line does not intersect plane', () => {
    const line = Line3.create({
      start: Vector3.create(0, 0, 0),
      end: Vector3.create(5, 0, 0),
    });
    const pt = Plane.intersectLine(plane, line);
    expect(pt).toBeUndefined();
  });

  it('returns start point if line is on plane', () => {
    const line = Line3.create({
      start: Vector3.create(5, 0, 10),
      end: Vector3.create(15, 0, 10),
    });
    const pt = Plane.intersectLine(plane, line);
    expect(pt).toEqual(line.start);
  });
});
