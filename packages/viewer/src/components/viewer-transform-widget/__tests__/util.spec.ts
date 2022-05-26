import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';

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
