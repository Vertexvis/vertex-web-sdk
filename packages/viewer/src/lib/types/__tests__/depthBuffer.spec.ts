import {
  BoundingBox,
  Dimensions,
  Point,
  Ray,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';

import { makeDepthImageBytes } from '../../../testing/fixtures';
import { DepthBuffer } from '../depthBuffer';
import { FrameCameraBase } from '../frame';
import { Viewport } from '../viewport';

describe(DepthBuffer, () => {
  const camera = FrameCameraBase.fromBoundingBox(
    {
      position: { x: 0, y: 0, z: -100 },
      lookAt: Vector3.origin(),
      up: Vector3.up(),
    },
    BoundingBox.create(
      Vector3.create(-100, -100, -100),
      Vector3.create(100, 100, 100)
    ),
    1
  );

  const depthBuffer = new DepthBuffer(
    camera,
    {
      frameDimensions: Dimensions.create(100, 100),
      imageRect: Rectangle.create(0, 0, 100, 100),
      imageScale: 1,
    },
    makeDepthImageBytes(100, 100, (2 ** 16 - 1) / 2)
  );

  describe(DepthBuffer.prototype.getLinearDepthAtPoint, () => {
    it('returns depth between near and far plane', () => {
      const depth = depthBuffer.getLinearDepthAtPoint(Point.create(1, 1));
      expect(depth).toBeCloseTo(camera.near + (camera.far - camera.near) / 2);
    });

    it('returns far plane if point outside viewport', () => {
      const depth = depthBuffer.getLinearDepthAtPoint(Point.create(-1, -1));
      expect(depth).toBeCloseTo(camera.far);
    });

    it('returns fallback depth', () => {
      const depth = depthBuffer.getLinearDepthAtPoint(Point.create(-1, -1), 0);
      expect(depth).toBeCloseTo(camera.near);
    });
  });

  describe(DepthBuffer.prototype.getNormalizedDepthAtPoint, () => {
    it('returns relative depth between 0 and 1', () => {
      const depth = depthBuffer.getNormalizedDepthAtPoint(Point.create(1, 1));
      expect(depth).toBeCloseTo(0.5);
    });

    it('returns 1 if point outside viewport', () => {
      const depth = depthBuffer.getNormalizedDepthAtPoint(Point.create(-1, -1));
      expect(depth).toBe(1);
    });

    it('returns fallback depth', () => {
      const depth = depthBuffer.getNormalizedDepthAtPoint(
        Point.create(-1, -1),
        0.5
      );
      expect(depth).toBe(0.5);
    });
  });

  describe(DepthBuffer.prototype.isOccluded, () => {
    it('returns true if distance of world point is further than depth value', () => {
      const occluded = depthBuffer.isOccluded(
        { x: 0, y: 0, z: 200 },
        new Viewport(100, 100)
      );
      expect(occluded).toBe(true);
    });

    it('returns false if distance of world point is closer than depth value', () => {
      const occluded = depthBuffer.isOccluded(
        { x: 0, y: 0, z: -100 },
        new Viewport(100, 100)
      );
      expect(occluded).toBe(false);
    });
  });

  describe(DepthBuffer.prototype.getWorldPoint, () => {
    const camera = FrameCameraBase.fromBoundingBox(
      {
        position: { x: 0, y: 0, z: 5 },
        lookAt: Vector3.origin(),
        up: Vector3.up(),
      },
      BoundingBox.create(Vector3.origin(), { x: 0, y: 0, z: 100 }),
      1
    );

    function createDepthBufferWithDepth(depthValue: number): {
      ray: Ray.Ray;
      depthBuffer: DepthBuffer;
      pt: Point.Point;
    } {
      const depthBuffer = new DepthBuffer(
        camera,
        {
          frameDimensions: Dimensions.create(100, 100),
          imageRect: Rectangle.create(0, 0, 100, 100),
          imageScale: 1,
        },
        makeDepthImageBytes(100, 100, depthValue)
      );

      const viewport = new Viewport(100, 100);
      const pt = Point.create(50, 50);
      const ray = viewport.transformPointToRay(pt, depthBuffer, camera);

      return { ray, depthBuffer, pt };
    }

    it('returns correct world position for near plane', () => {
      const { ray, depthBuffer, pt } = createDepthBufferWithDepth(0);
      const pos = depthBuffer.getWorldPoint(pt, ray);
      expect(pos.z).toBe(4);
    });

    it('returns correct world position for far plane', () => {
      const { ray, depthBuffer, pt } = createDepthBufferWithDepth(
        DepthBuffer.MAX_DEPTH_VALUE
      );
      const pos = depthBuffer.getWorldPoint(pt, ray);
      expect(pos.z).toBe(-95);
    });

    it('returns correct world position between near and far plane', () => {
      const { ray, depthBuffer, pt } = createDepthBufferWithDepth(
        DepthBuffer.MAX_DEPTH_VALUE / 2
      );
      const pos = depthBuffer.getWorldPoint(pt, ray);
      expect(pos.z).toBeCloseTo(-45.5);
    });
  });
});
