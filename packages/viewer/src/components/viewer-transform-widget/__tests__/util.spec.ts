import {
  Angle,
  Matrix4,
  Point,
  Quaternion,
  Vector3,
} from '@vertexvis/geometry';

import { Viewport } from '../../../lib/types';
import { makePerspectiveFrame } from '../../../testing/fixtures';
import {
  computeUpdatedTransform,
  convertCanvasPointToWorld,
  convertPointToCanvas,
} from '../util';

describe('vertex-viewer-transform-widget utils', () => {
  describe(convertPointToCanvas, () => {
    it('converts a point to the bounds of the canvas', () => {
      expect(
        convertPointToCanvas(Point.create(500, 500), {
          left: 250,
          top: 100,
        } as DOMRect)
      ).toMatchObject(Point.create(250, 400));
    });

    it('returns undefined if bounds are not provided', () => {
      expect(convertPointToCanvas(Point.create(500, 500))).toBeUndefined();
    });
  });

  describe(convertCanvasPointToWorld, () => {
    it('converts a canvas position to the world', () => {
      const worldPt = convertCanvasPointToWorld(
        Point.create(0, 0),
        makePerspectiveFrame(),
        new Viewport(100, 50),
        Matrix4.makeTranslation(Vector3.create(0, 0, 0))
      );

      expect(worldPt?.x).toBeCloseTo(-82.84271247462402);
      expect(worldPt?.y).toBeCloseTo(41.42135623731201);
      expect(worldPt?.z).toBe(0);
    });

    it('returns undefined if values are not provided', () => {
      expect(convertCanvasPointToWorld()).toBeUndefined();
      expect(convertCanvasPointToWorld(Point.create(0, 0))).toBeUndefined();
      expect(
        convertCanvasPointToWorld(Point.create(0, 0), makePerspectiveFrame())
      ).toBeUndefined();
      expect(
        convertCanvasPointToWorld(
          Point.create(0, 0),
          makePerspectiveFrame(),
          new Viewport(100, 50)
        )
      ).toBeUndefined();
    });
  });

  describe(computeUpdatedTransform, () => {
    it('computes updated x translation', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeTranslation(Vector3.back()),
          Vector3.origin(),
          Vector3.right(),
          Vector3.back(),
          0,
          'x-translate'
        )
      ).toMatchObject(Matrix4.makeTranslation(Vector3.create(1, 0, 1)));
    });

    it('computes updated y translation', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeTranslation(Vector3.back()),
          Vector3.origin(),
          Vector3.up(),
          Vector3.back(),
          0,
          'y-translate'
        )
      ).toMatchObject(Matrix4.makeTranslation(Vector3.create(0, 1, 1)));
    });

    it('computes updated z translation', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeTranslation(Vector3.back()),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.back(),
          0,
          'z-translate'
        )
      ).toMatchObject(Matrix4.makeTranslation(Vector3.create(0, 0, 0)));
    });

    it('computes updated x rotation when view vector is closer to parallel with negative x', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeIdentity(),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.create(-1, 0, 1),
          Angle.toRadians(45),
          'x-rotate'
        )
      ).toMatchObject(
        Matrix4.multiply(
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(45))
          ),
          Matrix4.invert(Matrix4.makeIdentity())
        )
      );
    });

    it('computes updated x rotation when view vector is closer to parallel with positive x', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeIdentity(),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.create(1, 0, 1),
          Angle.toRadians(45),
          'x-rotate'
        )
      ).toMatchObject(
        Matrix4.multiply(
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.right(), Angle.toRadians(45))
          ),
          Matrix4.invert(Matrix4.makeIdentity())
        )
      );
    });

    it('computes updated y rotation when view vector is closer to parallel with negative y', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeIdentity(),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.create(1, -1, 0),
          Angle.toRadians(45),
          'y-rotate'
        )
      ).toMatchObject(
        Matrix4.multiply(
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.down(), Angle.toRadians(45))
          ),
          Matrix4.invert(Matrix4.makeIdentity())
        )
      );
    });

    it('computes updated y rotation when view vector is closer to parallel with positive y', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeIdentity(),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.create(1, 1, 0),
          Angle.toRadians(45),
          'y-rotate'
        )
      ).toMatchObject(
        Matrix4.multiply(
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.up(), Angle.toRadians(45))
          ),
          Matrix4.invert(Matrix4.makeIdentity())
        )
      );
    });

    it('computes updated z rotation when view vector is closer to parallel with negative z', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeIdentity(),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.create(0, 1, -1),
          Angle.toRadians(45),
          'z-rotate'
        )
      ).toMatchObject(
        Matrix4.multiply(
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.forward(), Angle.toRadians(45))
          ),
          Matrix4.invert(Matrix4.makeIdentity())
        )
      );
    });

    it('computes updated z rotation when view vector is closer to parallel with positive z', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeIdentity(),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.create(0, 1, 1),
          Angle.toRadians(45),
          'z-rotate'
        )
      ).toMatchObject(
        Matrix4.multiply(
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.back(), Angle.toRadians(45))
          ),
          Matrix4.invert(Matrix4.makeIdentity())
        )
      );
    });

    it('returns the current position if no matching identifier is provided', () => {
      expect(
        computeUpdatedTransform(
          Matrix4.makeTranslation(Vector3.back()),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.back(),
          0,
          'non-matching-identifier'
        )
      ).toMatchObject(Matrix4.makeTranslation(Vector3.back()));
    });
  });
});
