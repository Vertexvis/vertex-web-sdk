import fs from 'fs/promises';
import path from 'path';
import { decode as decodePng } from 'fast-png';
import { Dimensions, Point, Rectangle } from '@vertexvis/geometry';
import {
  StencilBuffer,
  STENCIL_BUFFER_EMPTY_VALUE,
  STENCIL_BUFFER_FEATURE_VALUE,
} from '../stencilBuffer';
import { createDepthBuffer } from '../../../testing/fixtures';

describe(StencilBuffer, () => {
  const depthBuffer = createDepthBuffer(200, 100);

  const stencilBuffer = fs
    .readFile(path.resolve(__dirname, 'stencil-buffer.png'))
    .then((bytes) => ({ bytes, png: decodePng(bytes) }))
    .then(({ bytes, png }) => {
      return new StencilBuffer(
        {
          frameDimensions: Dimensions.create(1000, 1000),
          imageRect: Rectangle.create(0, 0, 632, 618),
          imageScale: 1,
        },
        bytes,
        new Uint8Array(png.data),
        png.channels,
        depthBuffer
      );
    });

  describe('getValue', () => {
    it('returns color if point within image rect', async () => {
      const stencil = await stencilBuffer;
      const actual = stencil.getValue(Point.create(150, 309));
      expect(actual).toEqual(STENCIL_BUFFER_FEATURE_VALUE);
    });

    it('returns undefined if color is empty color', async () => {
      const stencil = await stencilBuffer;
      const actual = stencil.getValue(Point.create(0, 0));
      expect(actual).toEqual(STENCIL_BUFFER_EMPTY_VALUE);
    });

    it('returns undefined if outside image rect', async () => {
      const stencil = await stencilBuffer;
      const actual = stencil.getValue(Point.create(1000, 1000));
      expect(actual).toEqual(STENCIL_BUFFER_EMPTY_VALUE);
    });
  });

  describe('snapToNearestPixel', () => {
    it('returns center of pixel if pt is a feature', async () => {
      const pt = Point.create(99, 0);
      const stencil = await stencilBuffer;
      const actual = stencil.snapToNearestPixel(pt, 1);

      expect(actual).toEqual(Point.create(99.5, 0.5));
    });

    it('returns center of pixel if pt is near a feature', async () => {
      const pt = Point.create(96, 0);
      const stencil = await stencilBuffer;
      const actual = stencil.snapToNearestPixel(pt, 2);

      expect(actual).toEqual(Point.create(97.5, 0.5));
    });

    it('returns undefined if no pixel within radius', async () => {
      const pt = Point.create(0, 0);
      const stencil = await stencilBuffer;
      const actual = stencil.snapToNearestPixel(pt, 2);
      expect(actual).toBeUndefined();
    });
  });
});
