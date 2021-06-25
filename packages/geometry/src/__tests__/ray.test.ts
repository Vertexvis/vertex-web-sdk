import * as Vector3 from '../vector3';
import * as Ray from '../ray';

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
