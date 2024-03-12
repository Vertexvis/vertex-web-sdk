import {
  Angle,
  Matrix4,
  Point,
  Quaternion,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';

import { Viewport } from '../../../lib/types';
import { makePerspectiveFrame } from '../../../testing/fixtures';
import {
  computeInputDisplayValue,
  computeInputPosition,
  computeInputTransform,
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

  describe(computeInputTransform, () => {
    it('computes an updated translation based on the difference', () => {
      expect(computeInputTransform('x-translate', 100, 90)).toMatchObject(
        Matrix4.makeTranslation(Vector3.create(10, 0, 0))
      );
    });

    it('computes an updated rotation based on the difference', () => {
      expect(computeInputTransform('x-rotate', 90, 0)).toMatchObject(
        Matrix4.makeRotation(
          Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(90))
        )
      );
    });

    it('converts distance units', () => {
      const transformMm = computeInputTransform(
        'x-translate',
        100,
        90,
        'millimeters'
      );
      expect(Vector3.fromMatrixPosition(transformMm).x).toBeCloseTo(10);

      const transformCm = computeInputTransform(
        'x-translate',
        100,
        90,
        'centimeters'
      );
      expect(Vector3.fromMatrixPosition(transformCm).x).toBeCloseTo(100);

      const transformM = computeInputTransform(
        'x-translate',
        100,
        90,
        'meters'
      );
      expect(Vector3.fromMatrixPosition(transformM).x).toBeCloseTo(10000);

      const transformIn = computeInputTransform(
        'x-translate',
        100,
        90,
        'inches'
      );
      expect(Vector3.fromMatrixPosition(transformIn).x).toBeCloseTo(254);

      const transformFt = computeInputTransform('x-translate', 100, 90, 'feet');
      expect(Vector3.fromMatrixPosition(transformFt).x).toBeCloseTo(3048);

      const transformYd = computeInputTransform(
        'x-translate',
        100,
        90,
        'yards'
      );
      expect(Vector3.fromMatrixPosition(transformYd).x).toBeCloseTo(9144);
    });

    it('converts angle units', () => {
      expect(
        computeInputTransform('x-rotate', 90, 0, undefined, 'degrees')
      ).toMatchObject(
        Matrix4.makeRotation(
          Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(90))
        )
      );

      expect(
        computeInputTransform('x-rotate', Math.PI / 2, 0, undefined, 'radians')
      ).toMatchObject(
        Matrix4.makeRotation(
          Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(90))
        )
      );
    });
  });

  describe(computeInputDisplayValue, () => {
    it('determines the display value for translation', () => {
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0))
        )
      ).toBeCloseTo(10);
    });

    it('determines the display value for rotation', () => {
      expect(
        computeInputDisplayValue(
          'x-rotate',
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(90))
          ),
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(45))
          )
        )
      ).toBeCloseTo(45);
    });

    it('converts distance units', () => {
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'millimeters'
        )
      ).toBeCloseTo(10);
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'centimeters'
        )
      ).toBeCloseTo(1);
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'meters'
        )
      ).toBeCloseTo(0.01);

      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'inches'
        )
      ).toBeCloseTo(0.394);
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'feet'
        )
      ).toBeCloseTo(0.0328);
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'yards'
        )
      ).toBeCloseTo(0.011);
    });

    it('converts angle units', () => {
      expect(
        computeInputDisplayValue(
          'x-rotate',
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(90))
          ),
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(45))
          ),
          undefined,
          'degrees'
        )
      ).toBeCloseTo(45);

      expect(
        computeInputDisplayValue(
          'x-rotate',
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(90))
          ),
          Matrix4.makeRotation(
            Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(45))
          ),
          undefined,
          'radians'
        )
      ).toBeCloseTo(Math.PI / 4);
    });
  });

  describe(computeInputPosition, () => {
    it('positions based on the closest corner', () => {
      const viewport = new Viewport(100, 100);
      const rectangle = Rectangle.create(25, 25, 50, 50);

      const topLeft = computeInputPosition(viewport, rectangle, [
        Point.create(-0.5, 0.5),
      ]);
      const topRight = computeInputPosition(viewport, rectangle, [
        Point.create(0.5, 0.5),
      ]);
      const bottomLeft = computeInputPosition(viewport, rectangle, [
        Point.create(-0.5, -0.5),
      ]);
      const bottomRight = computeInputPosition(viewport, rectangle, [
        Point.create(0.5, -0.5),
      ]);

      expect(topLeft.placement).toBe('top-left');
      expect(topRight.placement).toBe('top-right');
      expect(bottomLeft.placement).toBe('bottom-left');
      expect(bottomRight.placement).toBe('bottom-right');
    });
  });
});
