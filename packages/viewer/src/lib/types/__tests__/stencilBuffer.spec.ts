import { Dimensions, Point, Rectangle } from '@vertexvis/geometry';
import { StencilBuffer, STENCIL_BUFFER_EMPTY_COLOR } from '../stencilBuffer';
import { createStencilImageBytes } from '../../../testing/fixtures';
import { Color } from '@vertexvis/utils';

describe(StencilBuffer, () => {
  const color = Color.create(1, 2, 3);

  describe('getColor', () => {
    const shaded = new StencilBuffer(
      Dimensions.create(200, 100),
      createStencilImageBytes(100, 50, () => color),
      3,
      Rectangle.create(50, 25, 100, 50),
      1
    );

    const white = new StencilBuffer(
      Dimensions.create(200, 100),
      createStencilImageBytes(100, 50, () => STENCIL_BUFFER_EMPTY_COLOR),
      3,
      Rectangle.create(50, 25, 100, 50),
      1
    );

    it('returns color if point within image rect', () => {
      const actual = shaded.getColor(Point.create(50, 25));
      expect(actual).toEqual(color);
    });

    it('returns undefined if color is empty color', () => {
      const actual = white.getColor(Point.create(50, 25));
      expect(actual).toBeUndefined();
    });

    it('returns undefined if outside image rect', () => {
      const actual = white.getColor(Point.create(0, 0));
      expect(actual).toBeUndefined();
    });
  });

  describe('getNearestPixel', () => {
    const topLeft = new StencilBuffer(
      Dimensions.create(10, 10),
      createStencilImageBytes(10, 10, ({ x, y }) =>
        x < 5 && y < 5 ? color : STENCIL_BUFFER_EMPTY_COLOR
      ),
      3,
      Rectangle.create(0, 0, 10, 10),
      1
    );

    const bottomLeft = new StencilBuffer(
      Dimensions.create(10, 10),
      createStencilImageBytes(10, 10, ({ x, y }) =>
        x >= 5 && y >= 5 ? color : STENCIL_BUFFER_EMPTY_COLOR
      ),
      3,
      Rectangle.create(0, 0, 10, 10),
      1
    );

    it('returns point if non-white pixel', () => {
      const pt = Point.create(0, 0);
      const actual = topLeft.getNearestPixel(pt, 2);
      expect(actual).toEqual(pt);
    });

    it('returns closest non-white pixel within radius', () => {
      const pt1 = Point.create(5, 1);
      expect(topLeft.getNearestPixel(pt1, 2)).toEqual(Point.create(4, 1));

      const pt2 = Point.create(4, 9);
      expect(bottomLeft.getNearestPixel(pt2, 2)).toEqual(Point.create(5, 9));

      const pt3 = Point.create(9, 4);
      expect(bottomLeft.getNearestPixel(pt3, 2)).toEqual(Point.create(9, 5));
    });

    it('returns undefined if no non-white pixels within radius', () => {
      const pt = Point.create(9, 1);
      const actual = topLeft.getNearestPixel(pt, 2);
      expect(actual).toBeUndefined();
    });
  });
});
