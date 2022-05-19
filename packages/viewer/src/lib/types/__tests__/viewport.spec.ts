import { BoundingBox, Point, Ray, Vector3 } from '@vertexvis/geometry';

import { makeDepthBuffer } from '../../../testing/fixtures';
import { DepthBuffer } from '..';
import { FrameCameraBase } from '../frame';
import * as FrameCamera from '../frameCamera';
import { Viewport } from '../viewport';

describe('viewport utilities', () => {
  const orthographic = FrameCameraBase.fromBoundingBox(
    FrameCamera.createOrthographic(),
    BoundingBox.create(Vector3.create(-1, -1, -1), Vector3.create(1, 1, 1)),
    1
  );

  describe(Viewport.prototype.transformPointToOrthographicRay, () => {
    it('creates an orthographic ray', () => {
      const viewport = new Viewport(100, 100);

      const expectedOrigin = Vector3.transformMatrix(
        Vector3.transformMatrix(
          Vector3.create(-0.8, 0.8, 0),
          orthographic.projectionMatrixInverse
        ),
        orthographic.worldMatrix
      );

      expect(
        viewport.transformPointToOrthographicRay(
          Point.create(10, 10),
          makeDepthBuffer(100, 100),
          orthographic
        )
      ).toMatchObject({
        origin: expectedOrigin,
        direction: Vector3.normalize(orthographic.viewVector),
      });
    });

    it('computes an orthographic world position', () => {
      const viewport = new Viewport(100, 100);

      const buffer = makeDepthBuffer(100, 100, undefined, orthographic);
      const depth =
        (0.5 / DepthBuffer.MAX_DEPTH_VALUE) *
          (orthographic.far - orthographic.near) +
        orthographic.near / 2;
      const ray = viewport.transformPointToOrthographicRay(
        Point.create(10, 10),
        buffer,
        orthographic
      );

      expect(
        viewport.transformPointToOrthographicWorldSpace(
          Point.create(10, 10),
          buffer,
          0.5
        )
      ).toMatchObject(Ray.at(ray, depth));
    });
  });
});
