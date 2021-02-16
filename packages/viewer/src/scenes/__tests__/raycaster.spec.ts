jest.mock('@vertexvis/stream-api');

import { StreamApi } from '@vertexvis/stream-api';
import { Raycaster } from '../raycaster';
import { Point } from '@vertexvis/geometry';

describe(Raycaster, () => {
  const api = new StreamApi();
  const imageScaleProvider = (): Point.Point => Point.create(1, 1);

  describe(Raycaster.prototype.hitItems, () => {
    const raycaster = new Raycaster(api, imageScaleProvider);
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
  });
});
