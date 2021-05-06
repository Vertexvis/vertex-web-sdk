jest.mock('@vertexvis/stream-api');

import { BoundingBox, Dimensions, Point, Vector3 } from '@vertexvis/geometry';
import { computeWorldPosition } from '../coordinates';
import { Camera } from '../../scenes';
import { StreamApi } from '@vertexvis/stream-api';

describe(computeWorldPosition, () => {
  const viewport = Dimensions.create(100, 100);
  const camera = new Camera(
    new StreamApi(),
    1,
    {
      position: { x: 0, y: 0, z: 5 },
      lookAt: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    },
    BoundingBox.create(Vector3.origin(), { x: 0, y: 0, z: 100 })
  );
  const point = Point.create(50, 50);

  it('should return correct world position for near-plane depth', () => {
    const depth = 0;

    expect(computeWorldPosition(camera, viewport, point, depth).z).toBe(4);
  });

  it('should return correct world position for far-plane depth', () => {
    const depth = 1;

    expect(computeWorldPosition(camera, viewport, point, depth).z).toBe(-95);
  });

  it('should return correct world position for depths in-between near and far', () => {
    const depth = 0.5;

    expect(computeWorldPosition(camera, viewport, point, depth).z).toBe(-45.5);
  });
});
