jest.mock('@vertexvis/stream-api');

import { Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { CrossSectioning } from '../../types';
import { CrossSectioner } from '../crossSectioner';

describe(CrossSectioner, () => {
  const api = new StreamApi();

  describe(CrossSectioner.prototype.update, () => {
    const crossSectioner = new CrossSectioner(api, { sectionPlanes: [] });
    const updatedSectioning: CrossSectioning.CrossSectioning = {
      sectionPlanes: [
        {
          normal: Vector3.create({
            x: -1,
            y: 0,
            z: 0,
          }),
          offset: 500,
        },
      ],
    };

    (api.updateCrossSectioning as jest.Mock).mockResolvedValue({
      updateCrossSectioning: 'sandy',
    });

    it('updates cross sectioning', () => {
      crossSectioner.update(updatedSectioning);

      expect(api.updateCrossSectioning).toHaveBeenCalledWith(
        expect.objectContaining({
          crossSectioning: updatedSectioning,
        }),
        true
      );
    });
  });

  describe(CrossSectioner.prototype.current, () => {
    it('should return the current cross sectioning config', () => {
      const sectioning: CrossSectioning.CrossSectioning = {
        sectionPlanes: [
          {
            normal: Vector3.create({
              x: -1,
              y: 0,
              z: 0,
            }),
            offset: 500,
          },
        ],
      };

      const crossSectioner = new CrossSectioner(api, sectioning);

      expect(crossSectioner.current()).toBe(sectioning);
    });
  });
});
