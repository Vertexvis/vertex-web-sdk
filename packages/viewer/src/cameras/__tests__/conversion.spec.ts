import { cameraToEedc, cameraToPlatform } from '../conversion';

describe('camera conversions', () => {
  describe(cameraToEedc, () => {
    it('converts a platform camera to the eedc representation', () => {
      const platformCamera = {
        position: { x: 100 },
        up: { y: 1 },
        lookAt: { x: 1, y: 1, z: 1 },
      };

      expect(cameraToEedc(platformCamera)).toMatchObject({
        position: { x: 100, y: 0, z: 0 },
        upvector: { x: 0, y: 1, z: 0 },
        lookat: { x: 1, y: 1, z: 1 },
      });
    });
  });

  describe(cameraToPlatform, () => {
    it('converts an eedc camera to the platform representation', () => {
      const eedcCamera = {
        position: { x: 100, y: 0, z: 0 },
        upvector: { x: 0, y: 1, z: 0 },
        lookat: { x: 1, y: 1, z: 1 },
      };

      expect(cameraToPlatform(eedcCamera)).toMatchObject({
        position: { x: 100, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        lookAt: { x: 1, y: 1, z: 1 },
      });
    })
  })
});
