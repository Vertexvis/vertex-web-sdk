import { Dimensions, Point } from '@vertexvis/geometry';

import { translatePointToRelative, translatePointToScreen } from '../utils';

describe('viewer-pin-tool utils', () => {
  describe(translatePointToScreen, () => {
    it('should convert a relative point to the bounds of the canvas', () => {
      const pt1 = Point.create(-0.5, 0.5);
      const pt2 = Point.create(-0.25, 0.25);

      const dimensions1 = Dimensions.create(100, 100);
      const dimensions2 = Dimensions.create(100, 400);

      expect(translatePointToScreen(pt1, dimensions1)).toMatchObject({
        x: 0,
        y: 100,
      });
      expect(translatePointToScreen(pt2, dimensions1)).toMatchObject({
        x: 25,
        y: 75,
      });

      expect(translatePointToScreen(pt1, dimensions2)).toMatchObject({
        x: 0,
        y: 400,
      });
      expect(translatePointToScreen(pt2, dimensions2)).toMatchObject({
        x: 25,
        y: 300,
      });
    });
  });

  describe(translatePointToRelative, () => {
    it('should convert a screen point to the [-0.5, 0.5] range', () => {
      const dimensions = Dimensions.create(100, 100);

      const pt1 = Point.create(50, 50);
      const pt2 = Point.create(25, 75);
      const pt3 = Point.create(-25, -75);
      const pt4 = Point.create(1000, 1500);

      expect(translatePointToRelative(pt1, dimensions)).toMatchObject({
        x: 0,
        y: 0,
      });
      expect(translatePointToRelative(pt2, dimensions)).toMatchObject({
        x: -0.25,
        y: 0.25,
      });
      expect(translatePointToRelative(pt3, dimensions)).toMatchObject({
        x: -0.5,
        y: -0.5,
      });
      expect(translatePointToRelative(pt4, dimensions)).toMatchObject({
        x: 0.5,
        y: 0.5,
      });
    });
  });
});
