import { Dimensions, Point } from '@vertexvis/geometry';
import {
  computeNormalizedDeviceCoordinates,
  computeWorldPosition,
} from '../coordinates';
import {
  inverseProjectionMatrix,
  inverseViewMatrix,
} from '../../rendering/matrices';

describe(computeNormalizedDeviceCoordinates, () => {
  const viewport = Dimensions.create(100, 100);
  const point1 = Point.create(50, 50);
  const depth1 = 0;
  const point2 = Point.create(0, 0);
  const depth2 = 0.5;
  const point3 = Point.create(100, 100);
  const depth3 = 1;

  it('returns correct NDC values', () => {
    expect(
      computeNormalizedDeviceCoordinates(viewport, point1, 1, depth1)
    ).toMatchObject({
      x: 0,
      y: 0,
      z: -1,
    });

    expect(
      computeNormalizedDeviceCoordinates(viewport, point2, 1, depth1)
    ).toMatchObject({
      x: -1,
      y: 1,
      z: -1,
    });

    expect(
      computeNormalizedDeviceCoordinates(viewport, point3, 1, depth1)
    ).toMatchObject({
      x: 1,
      y: -1,
      z: -1,
    });

    expect(
      computeNormalizedDeviceCoordinates(viewport, point1, 1, depth2)
    ).toMatchObject({
      x: 0,
      y: 0,
      z: 0,
    });

    expect(
      computeNormalizedDeviceCoordinates(viewport, point1, 1, depth3)
    ).toMatchObject({
      x: 0,
      y: 0,
      z: 1,
    });
  });
});

describe(computeWorldPosition, () => {
  const near = 5;
  const far = 15;
  const viewport = Dimensions.create(100, 100);
  const inverseProjection = inverseProjectionMatrix(near, far, 45, 1);
  const inverseView = inverseViewMatrix({
    position: { x: 0, y: 0, z: 5 },
    lookAt: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  });
  const point = Point.create(50, 50);

  it('should return correct world position for near-plane depth', () => {
    const depth = 0;

    expect(
      computeWorldPosition(
        inverseProjection,
        inverseView,
        viewport,
        point,
        depth,
        near,
        far,
        1
      ).z
    ).toBe(0);
  });

  it('should return correct world position for far-plane depth', () => {
    const depth = 1;

    expect(
      computeWorldPosition(
        inverseProjection,
        inverseView,
        viewport,
        point,
        depth,
        near,
        far,
        1
      ).z
    ).toBe(-10);
  });

  it('should return correct world position for depths in-between near and far', () => {
    const depth = 0.5;

    expect(
      computeWorldPosition(
        inverseProjection,
        inverseView,
        viewport,
        point,
        depth,
        near,
        far,
        1
      ).z
    ).toBe(-5);
  });
});
