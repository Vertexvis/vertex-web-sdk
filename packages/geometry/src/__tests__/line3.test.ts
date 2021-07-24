import * as Line3 from '../line3';
import * as Matrix4 from '../matrix4';
import * as Vector3 from '../vector3';

const line = Line3.create({
  start: { x: 1, y: 1, z: 1 },
  end: { x: 2, y: 2, z: 2 },
});

describe(Line3.create, () => {
  it('creates a default line at origin', () => {
    const line = Line3.create();
    expect(line).toEqual(
      Line3.create({ start: Vector3.origin(), end: Vector3.origin() })
    );
  });
});

describe(Line3.center, () => {
  it('returns the center point between start and end', () => {
    const center = Line3.center(line);
    expect(center).toEqual(Vector3.create(1.5, 1.5, 1.5));
  });
});

describe(Line3.distance, () => {
  it('returns the distance between start and end', () => {
    const distance = Line3.distance(line);
    expect(distance).toEqual(Vector3.distance(line.start, line.end));
  });
});

describe(Line3.direction, () => {
  const direction = Line3.direction(line);
  const expected = Vector3.create(1, 1, 1);
  expect(direction).toEqual(expected);
});

describe(Line3.distanceSquared, () => {
  it('returns the squared distance between start and end', () => {
    const distance = Line3.distanceSquared(line);
    expect(distance).toEqual(Vector3.distanceSquared(line.start, line.end));
  });
});

describe(Line3.transformMatrix, () => {
  it('transforms the start and end of the line', () => {
    const matrix = Matrix4.makeScale(Vector3.create(2, 2, 2));
    const transformed = Line3.transformMatrix(line, matrix);
    expect(transformed).toEqual({
      start: Vector3.create(2, 2, 2),
      end: Vector3.create(4, 4, 4),
    });
  });
});
