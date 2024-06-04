import { BoundingBox, Point, Ray, Vector3 } from '@vertexvis/geometry';

import { FrameCamera, FrameCameraBase, Viewport } from '../../../lib/types';
import { makeDepthBuffer, makeStencilBuffer } from '../../../testing/fixtures';
import { PointToPointHitTester } from '../hitTest';

describe(PointToPointHitTester, () => {
  describe('with an orthographic camera', () => {
    const camera = FrameCameraBase.fromBoundingBox(
      FrameCamera.createOrthographic(),
      BoundingBox.create(Vector3.create(-1, -1, -1), Vector3.create(1, 1, 1)),
      1
    );

    const viewport = new Viewport(100, 100);
    const depthBuffer = makeDepthBuffer(100, 100, undefined, camera);
    const depth = camera.far - camera.near;
    const ray = viewport.transformPointToRay(
      Point.create(10, 10),
      depthBuffer,
      camera
    );

    it('transforms points to world coordinates for orthographic cameras with hit test', () => {
      const hitTester = new PointToPointHitTester(
        makeStencilBuffer(100, 100, () => 1, depthBuffer),
        depthBuffer,
        viewport,
        camera
      );

      expect(
        hitTester.transformPointToWorld(Point.create(10, 10))
      ).toMatchObject(Ray.at(ray, depth));
    });

    it('transforms points to world coordinates for orthographic cameras with hit test', () => {
      const failingHitTestBuffer = makeDepthBuffer(100, 100, undefined, camera);

      jest.spyOn(failingHitTestBuffer, 'hitTest').mockReturnValue(false);

      const hitTester = new PointToPointHitTester(
        undefined,
        failingHitTestBuffer,
        viewport,
        camera
      );

      expect(
        hitTester.transformPointToWorld(Point.create(10, 10), {
          ignoreHitTest: true,
        })
      ).toMatchObject(Ray.at(ray, depth));
    });
  });
});
