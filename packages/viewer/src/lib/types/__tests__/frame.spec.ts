import { Line3, Vector3 } from '@vertexvis/geometry';

import { FramePerspectiveCamera } from '../frame';

describe(FramePerspectiveCamera, () => {
  const camera = new FramePerspectiveCamera(
    Vector3.scale(2, Vector3.back()),
    Vector3.origin(),
    Vector3.up(),
    1,
    10,
    1,
    45
  );

  describe(FramePerspectiveCamera.prototype.isPointBehindNear, () => {
    it('returns true if world point behind near plane', () => {
      const pt = camera.position;
      expect(camera.isPointBehindNear(pt)).toBe(true);
    });

    it('returns false if world point in front of near plane', () => {
      const pt = Vector3.origin();
      expect(camera.isPointBehindNear(pt)).toBe(false);
    });
  });

  describe(FramePerspectiveCamera.prototype.intersectLineWithNear, () => {
    it('returns point on near plane if line intersects', () => {
      const line = Line3.create({
        start: Vector3.origin(),
        end: camera.position,
      });

      const pt = camera.intersectLineWithNear(line);
      expect(pt).toEqual(Vector3.create(0, 0, camera.near));
    });

    it('returns undefined if line does not intersect near plane', () => {
      const line = Line3.create({
        start: Vector3.left(),
        end: Vector3.right(),
      });

      const pt = camera.intersectLineWithNear(line);
      expect(pt).toBeUndefined();
    });
  });
});
