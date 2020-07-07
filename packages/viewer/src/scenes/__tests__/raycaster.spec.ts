jest.mock('@vertexvis/stream-api');

import { StreamApi } from '@vertexvis/stream-api';
import { Raycaster } from '../raycaster';
import { Point } from '@vertexvis/geometry';

describe(Raycaster, () => {
  const api = new StreamApi();

  describe(Raycaster.prototype.hitItems, () => {
    const raycaster = new Raycaster(api);
    (api.hitItems as jest.Mock).mockResolvedValue({
      hitItems: 'sandy',
    });
    it('returns hit items', () => {
      raycaster.hitItems(Point.create(10, 10));
      expect(api.hitItems).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          point: Point.create(10, 10),
        })
      );
    });
  });
});
