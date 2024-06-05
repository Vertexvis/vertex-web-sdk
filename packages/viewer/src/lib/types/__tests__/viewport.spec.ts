import { BoundingBox, Point, Ray, Vector3 } from '@vertexvis/geometry';

import { makeDepthBuffer } from '../../../testing/fixtures';
import { DepthBuffer } from '..';
import { FrameCameraBase } from '../frame';
import * as FrameCamera from '../frameCamera';
import { Viewport } from '../viewport';

describe('viewport utilities', () => {
  const perspective = FrameCameraBase.fromBoundingBox(
    FrameCamera.createPerspective(),
    BoundingBox.create(Vector3.create(-1, -1, -1), Vector3.create(1, 1, 1)),
    1
  );
  const orthographic = FrameCameraBase.fromBoundingBox(
    FrameCamera.createOrthographic(),
    BoundingBox.create(Vector3.create(-1, -1, -1), Vector3.create(1, 1, 1)),
    1
  );

  describe(Viewport.prototype.transformPointToRay, () => {
    it('creates an perspective ray', () => {
      const viewport = new Viewport(100, 100);

      const expectedOrigin = Vector3.create(0, 0, -1);
      const lookAtPoint = Vector3.transformMatrix(
        Vector3.transformMatrix(
          Vector3.create(-0.8, 0.8, 0.5),
          perspective.projectionMatrixInverse
        ),
        perspective.worldMatrix
      );
      const expectedDirection = Vector3.normalize(
        Vector3.subtract(lookAtPoint, expectedOrigin)
      );

      expect(
        viewport.transformPointToRay(
          Point.create(10, 10),
          makeDepthBuffer(100, 100),
          perspective
        )
      ).toMatchObject({
        origin: expectedOrigin,
        direction: expectedDirection,
      });
    });

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
        viewport.transformPointToRay(
          Point.create(10, 10),
          makeDepthBuffer(100, 100),
          orthographic
        )
      ).toMatchObject({
        origin: expectedOrigin,
        direction: Vector3.normalize(orthographic.viewVector),
      });
    });
  });

  describe(Viewport.prototype.transformPointToWorldSpace, () => {
    it('computes an perspective world position', () => {
      const viewport = new Viewport(100, 100);
      const desiredDepthPercentageToTest = 0.5;

      const buffer = makeDepthBuffer(100, 100, undefined, perspective);
      const depth =
        desiredDepthPercentageToTest * (perspective.far - perspective.near) +
        perspective.near;
      const ray = viewport.transformPointToRay(
        Point.create(10, 10),
        buffer,
        perspective
      );

      const worldPt = Ray.at(ray, perspective.far);
      const eyeToWorldPt = Vector3.subtract(worldPt, perspective.position);

      const angle =
        Vector3.dot(perspective.viewVector, eyeToWorldPt) /
        (Vector3.magnitude(perspective.viewVector) *
          Vector3.magnitude(eyeToWorldPt));

      expect(
        viewport.transformPointToWorldSpace(
          Point.create(10, 10),
          buffer,
          desiredDepthPercentageToTest * DepthBuffer.MAX_DEPTH_VALUE
        )
      ).toMatchObject(Ray.at(ray, depth / angle));
    });

    it('computes an orthographic world position', () => {
      const viewport = new Viewport(100, 100);
      const desiredDepthPercentageToTest = 0.5;

      const buffer = makeDepthBuffer(100, 100, undefined, orthographic);
      const depth =
        desiredDepthPercentageToTest * (orthographic.far - orthographic.near);
      const ray = viewport.transformPointToRay(
        Point.create(10, 10),
        buffer,
        orthographic
      );

      expect(
        viewport.transformPointToWorldSpace(
          Point.create(10, 10),
          buffer,
          desiredDepthPercentageToTest * DepthBuffer.MAX_DEPTH_VALUE
        )
      ).toMatchObject(Ray.at(ray, depth));
    });
  });
});
