jest.mock('@vertexvis/stream-api');

import { StreamApi } from '@vertexvis/stream-api';
import { Raycaster } from '../raycaster';
import { Point } from '@vertexvis/geometry';

describe(Raycaster, () => {
  const api = new StreamApi();
  const imageScaleProvider = (x: number, y: number) => (): Point.Point =>
    Point.create(x, y);

  describe(Raycaster.prototype.hitItems, () => {
    const raycaster = new Raycaster(api, imageScaleProvider(1, 1));
    (api.hitItems as jest.Mock).mockResolvedValue({
      hitItems: 'sandy',
    });
    it('returns hit items', () => {
      raycaster.hitItems(Point.create(10, 10));
      expect(api.hitItems).toHaveBeenCalledWith(
        expect.objectContaining({
          point: Point.create(10, 10),
        }),
        true
      );
    });

    it('should scale points to base image dimensions', () => {
      const scaledRaycaster = new Raycaster(api, imageScaleProvider(0.5, 0.75));
      scaledRaycaster.hitItems(Point.create(100, 100));
      expect(api.hitItems).toHaveBeenCalledWith(
        expect.objectContaining({
          point: Point.create(50, 75),
        }),
        true
      );
    });

    it('should support requesting for metadata', () => {
      raycaster.hitItems(Point.create(10, 10), { includeMetadata: true });
      expect(api.hitItems).toHaveBeenCalledWith(
        expect.objectContaining({
          point: Point.create(10, 10),
          includeMetadata: true,
        }),
        true
      );
    });
  });
});
