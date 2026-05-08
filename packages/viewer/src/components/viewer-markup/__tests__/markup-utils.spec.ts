import { Dimensions, Point } from '@vertexvis/geometry';

import {
  translateDimensionsToScreen,
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

    it('centers the markup horizontally on the canvas when the centering behavior is set to "x-only"', () => {
      const canvasDimensions = Dimensions.create(100, 100);
      const contentDimensions = Dimensions.create(150, 250);
      const pt = Point.create(0, 0);

      // Expected point is at [75, 125] in the original dimensions, which will be scaled to [15, 25]
      // to map to canvas dimensions with 0.5 scale, and finally up to [50, 25] with centering.
      expect(
        translatePointToScreen(
          pt,
          canvasDimensions,
          contentDimensions,
          'x-only',
          0.5
        )
      ).toMatchObject({
        x: 50,
        y: 25,
      });
    });

    it('centers the markup vertically on the canvas when the centering behavior is set to "y-only"', () => {
      const canvasDimensions = Dimensions.create(100, 100);
      const contentDimensions = Dimensions.create(150, 250);
      const pt = Point.create(0, 0);

      // Expected point is at [75, 125] in the original dimensions, which will be scaled to [15, 25]
      // to map to canvas dimensions with 0.5 scale, and finally up to [15, 50] with centering.
      expect(
        translatePointToScreen(
          pt,
          canvasDimensions,
          contentDimensions,
          'y-only',
          0.5
        )
      ).toMatchObject({
        x: 15,
        y: 50,
      });
    });

    it('centers the markup both horizontally and vertically on the canvas when the centering behavior is set to "both"', () => {
      const canvasDimensions = Dimensions.create(100, 100);
      const contentDimensions = Dimensions.create(150, 250);
      const pt = Point.create(0, 0);

      // Expected point is at [75, 125] in the original dimensions, which will be scaled to [15, 25]
      // to map to canvas dimensions with 0.5 scale, and finally up to [50, 50] with centering.
      expect(
        translatePointToScreen(
          pt,
          canvasDimensions,
          contentDimensions,
          'both',
          0.5
        )
      ).toMatchObject({
        x: 50,
        y: 50,
      });
    });

    it('scales the markup when a scale greater than 1 is provided', () => {
      const canvasDimensions = Dimensions.create(100, 100);
      const contentDimensions = Dimensions.create(200, 200);
      const pt = Point.create(0, 0);

      // Expected point is at [100, 100] in the original dimensions, which will be scaled to [50, 50]
      // to map to canvas dimensions, and finally up to [250, 250] with the 5x scale.
      expect(
        translatePointToScreen(
          pt,
          canvasDimensions,
          contentDimensions,
          'both',
          5
        )
      ).toMatchObject({
        x: 250,
        y: 250,
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

    it('translates a screen point to relative coordinates based on the height of the provided dimensions with an offset', () => {
      const canvasDimensions = Dimensions.create(400, 400);
      const contentDimensions = Dimensions.create(100, 200);
      const offset = Point.create(0, 10);
      const pt = Point.create(0, 60);

      // The point without offset is at [0, 50] in the current canvas dimensions, which maps to [0, 25] in the original content dimensions.
      // Relative to the center of the content dimensions, this becomes [-50, -75], which then becomes [-0.25, -0.375] in relative coordinates
      // leveraging the content's height as the scale factor.
      expect(
        translatePointToRelative(
          pt,
          canvasDimensions,
          contentDimensions,
          'none',
          1,
          offset
        )
      ).toMatchObject({
        x: -0.25,
        y: -0.375,
      });
    });

    it('translates a screen point to relative coordinates based on the height of the provided dimensions with centering', () => {
      const canvasDimensions = Dimensions.create(400, 400);
      const contentDimensions = Dimensions.create(100, 200);
      const offset = Point.create(0, 10);
      const pt = Point.create(0, 60);

      // The point without offset is at [0, 50] in the current canvas dimensions, which maps to [0, 50] in the original content dimensions.
      // With centering, this becomes [-150, -50], and relative to the center of the content dimensions, this becomes [-200, -150] (this
      // is technically outside of the content dimensions, but we still want to return a value that can be rendered when zoomed out). This
      // then becomes [-1, -0.75] in relative coordinates.
      expect(
        translatePointToRelative(
          pt,
          canvasDimensions,
          contentDimensions,
          'both',
          0.5,
          offset
        )
      ).toMatchObject({
        x: -1,
        y: -0.75,
      });
    });
  });

  describe(translateDimensionsToScreen, () => {
    it('translates dimensions to screen coordinates relative to the provided content dimensions', () => {
      const dimensions = Dimensions.create(0.5, 0.5);
      const contentDimensions = Dimensions.create(250, 250);
      const canvasDimensions = Dimensions.create(100, 100);

      // Initial dimensions are [125, 125] relative to the original dimensions, which will map to [50, 50] in
      // canvas dimensions. This value is then scaled down to [25, 25] with the 0.5 scale.
      expect(
        translateDimensionsToScreen(
          dimensions,
          canvasDimensions,
          contentDimensions,
          0.5
        )
      ).toMatchObject({
        width: 25,
        height: 25,
      });
    });
  });
});
