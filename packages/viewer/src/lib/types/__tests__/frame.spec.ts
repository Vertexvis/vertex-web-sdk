import { BoundingBox, Line3, Matrix4, Vector3 } from '@vertexvis/geometry';
import { Dimensions } from '@vertexvis/geometry';

import { makeImageAttributes } from '../../../testing/fixtures';
import { FrameCamera } from '..';
import {
  Frame,
  FrameImage,
  FrameOrthographicCamera,
  FramePerspectiveCamera,
  FrameScene,
} from '../frame';

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

  describe(FramePerspectiveCamera.prototype.toOrthographic, () => {
    it('converts to an orthographic camera', () => {
      const bounds = BoundingBox.create(
        Vector3.create(-1, -1, -1),
        Vector3.create(1, 1, 1)
      );
      const asOrthographic = FrameCamera.toOrthographic(camera, bounds);

      expect(camera.toOrthographic(bounds)).toMatchObject({
        ...asOrthographic,
        near: -Math.sqrt(3),
        far: Math.sqrt(3),
      });
    });
  });

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

describe(FrameOrthographicCamera, () => {
  const camera = new FrameOrthographicCamera(
    Vector3.scale(2, Vector3.forward()),
    Vector3.origin(),
    Vector3.up(),
    1,
    10,
    1,
    45
  );

  describe(FrameOrthographicCamera.prototype.toPerspective, () => {
    it('converts to a perspective camera', () => {
      const bounds = BoundingBox.create(
        Vector3.create(-1, -1, -1),
        Vector3.create(1, 1, 1)
      );
      const asPerspective = FrameCamera.toPerspective(camera);
      const converted = camera.toPerspective(bounds);

      expect(converted).toMatchObject(asPerspective);
      expect(converted.near).toBeCloseTo(52.5877);
      expect(converted.far).toBeCloseTo(56.0518);
    });
  });

  describe(FrameOrthographicCamera.prototype.isPointBehindNear, () => {
    it('returns true if world point behind near plane', () => {
      const pt = camera.position;
      expect(camera.isPointBehindNear(pt)).toBe(true);
    });

    it('returns false if world point in front of near plane', () => {
      const pt = Vector3.origin();
      expect(camera.isPointBehindNear(pt)).toBe(false);
    });
  });

  describe(FrameOrthographicCamera.prototype.intersectLineWithNear, () => {
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

    it('computes the orthographic projection matrix', () => {
      expect(camera.projectionMatrix).toMatchObject(
        Matrix4.makeOrthographic(
          camera.left,
          camera.right,
          camera.bottom,
          camera.top,
          camera.near,
          camera.far
        )
      );
    });
  });
});

describe(Frame, () => {
  it('should include the ID on a copy', () => {
    const frame = new Frame(
      [],
      2,
      {} as Dimensions,
      new FrameImage(makeImageAttributes(1, 2), new Uint8Array()),
      {} as FrameScene,
      undefined,
      undefined
    );

    expect(frame.getId()).toEqual(frame.copy({}).getId());
  });
});
