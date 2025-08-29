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
  calculateNewRotationAngle,
  computeHandleDeltaTransform,
  computeInputDeltaTransform,
  computeInputDisplayValue,
  computeInputPosition,
  convertCanvasPointToWorld,
  convertPointToCanvas,
} from '../util';

function expectMatrixCloseTo(
  actual: Matrix4.Matrix4,
  expected: Matrix4.Matrix4
): void {
  actual.forEach((ev, i) => {
    expect(ev).toBeCloseTo(expected[i]);
  });
}

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

  describe(computeHandleDeltaTransform, () => {
    it('computes updated x translation', () => {
      expect(
        computeHandleDeltaTransform(
          Matrix4.makeTranslation(Vector3.back()),
          Vector3.origin(),
          Vector3.right(),
          Vector3.back(),
          0,
          'x-translate'
        )
      ).toMatchObject(Matrix4.makeTranslation(Vector3.create(1, 0, 0)));
    });

    it('computes updated y translation', () => {
      expect(
        computeHandleDeltaTransform(
          Matrix4.makeTranslation(Vector3.back()),
          Vector3.origin(),
          Vector3.up(),
          Vector3.back(),
          0,
          'y-translate'
        )
      ).toMatchObject(Matrix4.makeTranslation(Vector3.create(0, 1, 0)));
    });

    it('computes updated z translation', () => {
      expect(
        computeHandleDeltaTransform(
          Matrix4.makeTranslation(Vector3.back()),
          Vector3.origin(),
          Vector3.forward(),
          Vector3.back(),
          0,
          'z-translate'
        )
      ).toMatchObject(Matrix4.makeTranslation(Vector3.create(0, 0, -1)));
    });

    it('computes updated x rotation when view vector is closer to parallel with negative x', () => {
      expect(
        computeHandleDeltaTransform(
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
        computeHandleDeltaTransform(
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
        computeHandleDeltaTransform(
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
        computeHandleDeltaTransform(
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
        computeHandleDeltaTransform(
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
        computeHandleDeltaTransform(
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
        computeHandleDeltaTransform(
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

  describe(computeInputDeltaTransform, () => {
    it('computes an updated translation based on the difference', () => {
      expect(
        computeInputDeltaTransform(
          Matrix4.makeIdentity(),
          'x-translate',
          100,
          90,
          'millimeters',
          'degrees'
        )
      ).toMatchObject(Matrix4.makeTranslation(Vector3.create(10, 0, 0)));
    });

    it('computes an updated rotation based on the difference', () => {
      expectMatrixCloseTo(
        computeInputDeltaTransform(
          Matrix4.makeIdentity(),
          'x-rotate',
          90,
          0,
          'millimeters',
          'degrees'
        ),
        Matrix4.makeRotation(
          Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(90))
        )
      );
    });

    it('converts distance units', () => {
      const transformMm = computeInputDeltaTransform(
        Matrix4.makeIdentity(),
        'x-translate',
        100,
        90,
        'millimeters',
        'degrees'
      );
      expect(Vector3.fromMatrixPosition(transformMm).x).toBeCloseTo(10);

      const transformCm = computeInputDeltaTransform(
        Matrix4.makeIdentity(),
        'x-translate',
        100,
        90,
        'centimeters',
        'degrees'
      );
      expect(Vector3.fromMatrixPosition(transformCm).x).toBeCloseTo(100);

      const transformM = computeInputDeltaTransform(
        Matrix4.makeIdentity(),
        'x-translate',
        100,
        90,
        'meters',
        'degrees'
      );
      expect(Vector3.fromMatrixPosition(transformM).x).toBeCloseTo(10000);

      const transformIn = computeInputDeltaTransform(
        Matrix4.makeIdentity(),
        'x-translate',
        100,
        90,
        'inches',
        'degrees'
      );
      expect(Vector3.fromMatrixPosition(transformIn).x).toBeCloseTo(254);

      const transformFt = computeInputDeltaTransform(
        Matrix4.makeIdentity(),
        'x-translate',
        100,
        90,
        'feet',
        'degrees'
      );
      expect(Vector3.fromMatrixPosition(transformFt).x).toBeCloseTo(3048);

      const transformYd = computeInputDeltaTransform(
        Matrix4.makeIdentity(),
        'x-translate',
        100,
        90,
        'yards',
        'degrees'
      );
      expect(Vector3.fromMatrixPosition(transformYd).x).toBeCloseTo(9144);
    });

    it('converts angle units', () => {
      expectMatrixCloseTo(
        computeInputDeltaTransform(
          Matrix4.makeIdentity(),
          'x-rotate',
          90,
          0,
          'millimeters',
          'degrees'
        ),
        Matrix4.makeRotation(
          Quaternion.fromAxisAngle(Vector3.left(), Angle.toRadians(90))
        )
      );

      expectMatrixCloseTo(
        computeInputDeltaTransform(
          Matrix4.makeIdentity(),
          'x-rotate',
          Math.PI / 2,
          0,
          'millimeters',
          'radians'
        ),
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
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'millimeters',
          'degrees'
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
          ),
          'millimeters',
          'degrees'
        )
      ).toBeCloseTo(45);
    });

    it('converts distance units', () => {
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'millimeters',
          'degrees'
        )
      ).toBeCloseTo(10);
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'centimeters',
          'degrees'
        )
      ).toBeCloseTo(1);
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'meters',
          'degrees'
        )
      ).toBeCloseTo(0.01);

      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'inches',
          'degrees'
        )
      ).toBeCloseTo(0.394);
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'feet',
          'degrees'
        )
      ).toBeCloseTo(0.0328);
      expect(
        computeInputDisplayValue(
          'x-translate',
          Matrix4.makeTranslation(Vector3.create(100, 0, 0)),
          Matrix4.makeTranslation(Vector3.create(90, 0, 0)),
          'yards',
          'degrees'
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
          'millimeters',
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
          'millimeters',
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

  describe(calculateNewRotationAngle, () => {
    const pointerMoveWithShift = new MouseEvent('pointermove', {
      screenX: 110,
      screenY: 60,
      buttons: 1,
      bubbles: true,
      shiftKey: true,
    }) as PointerEvent;
    const pointerMoveWithoutShift = new MouseEvent('pointermove', {
      screenX: 110,
      screenY: 60,
      buttons: 1,
      bubbles: true,
      shiftKey: false,
    }) as PointerEvent;

    it('returns the original angle when degreeToSnapToWhenRotating is undefined', () => {
      const angleToRotate = calculateNewRotationAngle(
        pointerMoveWithShift,
        0.9,
        0.2,
        102,
        undefined
      );

      expect(angleToRotate).toBe(0.9);
    });

    it('returns the original angle when shift key is not held', () => {
      const angleToRotate = calculateNewRotationAngle(
        pointerMoveWithoutShift,
        0.9,
        0.2,
        102,
        5
      );

      expect(angleToRotate).toBe(0.9);
    });

    it('returns the rounded angle with an existing angle', () => {
      const angleToRotate = calculateNewRotationAngle(
        pointerMoveWithShift,
        0.9,
        0.2,
        102,
        5
      );

      expect(angleToRotate).toBe(0.8632251157578452);
    });

    it('returns the rounded angle without an existing angle', () => {
      const angleToRotate = calculateNewRotationAngle(
        pointerMoveWithShift,
        0.9,
        0.2,
        0,
        5
      );

      expect(angleToRotate).toBe(0.8981317007977319);
    });
  });
});
