import { Dimensions, Point } from '@vertexvis/geometry';

import {
  translatePointToRelative,
  translatePointToScreen,
} from '../markup-utils';

describe('markup utils', () => {
  describe(translatePointToScreen, () => {
    it('translates a relative point to screen coordinates based on the height of the provided dimensions', () => {
      const dimensions1 = Dimensions.create(100, 100);
      const dimensions2 = Dimensions.create(50, 100);
      const dimensions3 = Dimensions.create(100, 50);

      const pt1 = Point.create(-0.5, 0.5);
      const pt2 = Point.create(-0.25, 0.25);

      expect(translatePointToScreen(pt1, dimensions1)).toMatchObject({
        x: 0,
        y: 100,
      });
      expect(translatePointToScreen(pt2, dimensions1)).toMatchObject({
        x: 25,
        y: 75,
      });

      expect(translatePointToScreen(pt1, dimensions2)).toMatchObject({
        x: -25,
        y: 100,
      });
      expect(translatePointToScreen(pt2, dimensions2)).toMatchObject({
        x: 0,
        y: 75,
      });

      expect(translatePointToScreen(pt1, dimensions3)).toMatchObject({
        x: 25,
        y: 50,
      });
      expect(translatePointToScreen(pt2, dimensions3)).toMatchObject({
        x: 37.5,
        y: 37.5,
      });
    });
  });

  describe(translatePointToRelative, () => {
    it('translates a screen point to relative coordinates based on the height of the provided dimensions', () => {
      const dimensions1 = Dimensions.create(100, 100);
      const dimensions2 = Dimensions.create(50, 100);
      const dimensions3 = Dimensions.create(100, 50);

      const pt1 = Point.create(0, 100);
      const pt2 = Point.create(75, 25);

      expect(translatePointToRelative(pt1, dimensions1)).toMatchObject({
        x: -0.5,
        y: 0.5,
      });
      expect(translatePointToRelative(pt2, dimensions1)).toMatchObject({
        x: 0.25,
        y: -0.25,
      });

      // center = 25, 50
      expect(translatePointToRelative(pt1, dimensions2)).toMatchObject({
        x: -0.25,
        y: 0.5,
      });
      expect(translatePointToRelative(pt2, dimensions2)).toMatchObject({
        x: 0.5,
        y: -0.25,
      });

      // center = 50, 25
      expect(translatePointToRelative(pt1, dimensions3)).toMatchObject({
        x: -1,
        y: 1.5,
      });
      expect(translatePointToRelative(pt2, dimensions3)).toMatchObject({
        x: 0.5,
        y: 0,
      });
    });
  });
});
