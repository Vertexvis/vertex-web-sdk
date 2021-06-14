import {
  BoundingBox,
  Dimensions,
  Point,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import { DepthBuffer } from '../depthBuffer';
import { FramePerspectiveCamera } from '../frame';
import { createDepthImageBytes } from '../../../testing/fixtures';
import { Viewport } from '../viewport';

describe(DepthBuffer, () => {
  const camera = FramePerspectiveCamera.fromBoundingBox(
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
    Dimensions.create(100, 100),
    Rectangle.create(0, 0, 100, 100),
    1,
    createDepthImageBytes(100, 100, (2 ** 16 - 1) / 2)
  );

  describe(DepthBuffer.prototype.getLinearDepthAtPoint, () => {
    it('returns depth between near and far plane', () => {
      const depth = depthBuffer.getLinearDepthAtPoint(Point.create(1, 1));
      expect(depth).toBeCloseTo(camera.near + (camera.far - camera.near) / 2);
    });

    it('returns far plane if point outside viewport', () => {
      const depth = depthBuffer.getLinearDepthAtPoint(Point.create(0, 0));
      expect(depth).toBeCloseTo(camera.far);
    });
  });

  describe(DepthBuffer.prototype.getNormalizedDepthAtPoint, () => {
    it('returns relative depth between 0 and 1', () => {
      const depth = depthBuffer.getNormalizedDepthAtPoint(Point.create(1, 1));
      expect(depth).toBeCloseTo(0.5);
    });

    it('returns 1 if point outside viewport', () => {
      const depth = depthBuffer.getNormalizedDepthAtPoint(Point.create(0, 0));
      expect(depth).toBe(1);
    });
  });

  describe(DepthBuffer.prototype.isOccluded, () => {
    it('returns true if distance of world point is further than depth value', () => {
      const occluded = depthBuffer.isOccluded(
        new Viewport(Dimensions.create(100, 100)),
        { x: 0, y: 0, z: 200 }
      );
      expect(occluded).toBe(true);
    });

    it('returns false if distance of world point is closer than depth value', () => {
      const occluded = depthBuffer.isOccluded(
        new Viewport(Dimensions.create(100, 100)),
        { x: 0, y: 0, z: -100 }
      );
      expect(occluded).toBe(false);
    });
  });
});
