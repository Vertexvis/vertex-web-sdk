import { Scene } from '../scene';
import { StreamApi } from '@vertexvis/stream-api';
import { Dimensions } from '@vertexvis/geometry';
import { frame } from '../../types/__fixtures__';

describe(Scene, () => {
  const scene = new Scene(new StreamApi(), frame);

  describe(Scene.prototype.camera, () => {
    const camera = scene.camera();

    it('should return camera with aspect ratio of current scene', () => {
      expect(camera.aspectRatio).toBe(2);
    });

    it('should return camera with latest camera from frame', () => {
      expect(camera).toMatchObject({
        position: camera.position,
        lookAt: camera.lookAt,
        up: camera.up,
      });
    });
  });

  describe(Scene.prototype.viewport, () => {
    it('should return dimensions of latest frame', () => {
      expect(scene.viewport()).toEqual(Dimensions.create(100, 50));
    });
  });
});
