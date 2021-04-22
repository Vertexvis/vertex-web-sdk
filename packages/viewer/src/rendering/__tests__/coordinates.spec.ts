import {
  BoundingBox,
  Dimensions,
  Matrix4,
  Point,
  Vector3,
} from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { Camera } from '../../scenes';
import {
  computeNormalizedDeviceCoordinates,
  computeWorldPosition,
} from '../coordinates';
import {
  inverseProjectionMatrix,
  inverseViewMatrix,
  viewMatrix,
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
      computeNormalizedDeviceCoordinates(viewport, point1, depth1)
    ).toMatchObject({
      x: 0,
      y: 0,
      z: -1,
    });

    expect(
      computeNormalizedDeviceCoordinates(viewport, point2, depth1)
    ).toMatchObject({
      x: -1,
      y: 1,
      z: -1,
    });

    expect(
      computeNormalizedDeviceCoordinates(viewport, point3, depth1)
    ).toMatchObject({
      x: 1,
      y: -1,
      z: -1,
    });

    expect(
      computeNormalizedDeviceCoordinates(viewport, point1, depth2)
    ).toMatchObject({
      x: 0,
      y: 0,
      z: 0,
    });

    expect(
      computeNormalizedDeviceCoordinates(viewport, point1, depth3)
    ).toMatchObject({
      x: 0,
      y: 0,
      z: 1,
    });
  });
});

describe(computeWorldPosition, () => {
  const near = 1;
  const far = 50;
  const viewport = Dimensions.create(100, 100);
  const inverseProjection = inverseProjectionMatrix(near, far, 45, 1);
  const inverseView = Matrix4.inverse(
    viewMatrix({
      position: { x: 0, y: 0, z: 1 },
      lookAt: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    })
  );
  const point = Point.create(50, 50);
  const depth1 = 0;
  const depth2 = 1;
  // (depthBufferDepth * (far - near) + near) / far
  // [0, 1] [camera.position, far]

  const d1 = 0.5 * 2 - 1;
  const depth3 = (2.0 * near * far) / (far + near - d1 * (far - near));

  const depth4 = Matrix4.multiplyVector3(inverseProjection, {
    x: 0,
    y: 0,
    z: 0.5,
  });
  const depth5 = Vector3.scale(1 / depth4.w, depth4);

  console.log(depth5);

  it('should return correct world position', () => {
    console.log(inverseProjection);
    console.log(inverseView);

    // expect(
    //   computeWorldPosition(
    //     inverseProjection,
    //     inverseView,
    //     viewport,
    //     point,
    //     depth1
    //   )
    // ).toMatchObject({
    //   x: 0,
    //   y: 0,
    //   z: 0,
    // });

    // expect(
    //   computeWorldPosition(
    //     inverseProjection,
    //     inverseView,
    //     viewport,
    //     point,
    //     depth2
    //   )
    // ).toMatchObject({
    //   x: 0,
    //   y: 0,
    //   z: -1,
    // });

    expect(
      computeWorldPosition(
        inverseProjection,
        inverseView,
        viewport,
        point,
        d1
      ).z
    ).toBeCloseTo(-1);
  });
});
