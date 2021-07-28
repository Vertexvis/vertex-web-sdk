import * as Vector3 from '../vector3';
import * as Ray from '../ray';
import * as Plane from '../plane';

describe(Ray.create, () => {
  it('creates a ray with defaults', () => {
    const ray = Ray.create();
    expect(ray.origin).toEqual(Vector3.origin());
    expect(ray.direction).toEqual(Vector3.forward());
  });

  it('creates a ray with values', () => {
    const origin = Vector3.create(1, 1, 1);
    const direction = Vector3.back();
    const ray = Ray.create({ origin, direction });
    expect(ray.origin).toEqual(origin);
    expect(ray.direction).toEqual(direction);
  });
});

describe(Ray.at, () => {
  it('returns a point on the ray', () => {
    const ray = Ray.create({
      origin: Vector3.create(1, 1, 1),
      direction: Vector3.right(),
    });

    const pt = Ray.at(ray, 10);
    expect(pt).toEqual(Vector3.create(11, 1, 1));
  });
});

describe(Ray.distanceToPlane, () => {
  const plane = Plane.create({ normal: Vector3.create(0, 0, 1), constant: -5 });

  it("returns distance from ray's origin to the plane", () => {
    const ray = Ray.create({
      origin: Vector3.create(0, 0, 15),
      direction: Vector3.create(0, 0, -1),
    });

    expect(Ray.distanceToPlane(ray, plane)).toBe(10);
  });

  it('returns undefined if ray does not intersect plane', () => {
    const ray = Ray.create({
      origin: Vector3.create(0, 0, 20),
      direction: Vector3.create(0, 0, 1),
    });

    expect(Ray.distanceToPlane(ray, plane)).toBeUndefined();
  });
});

describe(Ray.intersectPlane, () => {
  const plane = Plane.create({ normal: Vector3.create(0, 0, 1), constant: -5 });

  it('returns intersection point', () => {
    const ray = Ray.create({
      origin: Vector3.create(0, 0, 15),
      direction: Vector3.create(0, 0, -1),
    });

    expect(Ray.intersectPlane(ray, plane)).toEqual(Vector3.create(0, 0, 5));
  });

  it('returns undefined if ray does not intersect plane', () => {
    const ray = Ray.create({
      origin: Vector3.create(0, 0, 20),
      direction: Vector3.create(0, 0, 1),
    });

    expect(Ray.intersectPlane(ray, plane)).toBeUndefined();
  });
});
