import { Scene } from '../scene';
import { StreamApi } from '@vertexvis/stream-api';
import { Dimensions } from '@vertexvis/geometry';
import { frame } from '../../types/__fixtures__';
import { CommandRegistry } from '../../commands/commandRegistry';
import { UUID } from '@vertexvis/utils';

describe(Scene, () => {
  const executeMock = jest.fn();
  const commandRegistry = ({
    execute: executeMock,
  } as unknown) as CommandRegistry;
  const sceneViewId: UUID.UUID = UUID.create();
  const scene = new Scene(new StreamApi(), frame, commandRegistry, sceneViewId);

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

  // describe(Scene.prototype.itemOperation)

  describe(Scene.prototype.viewport, () => {
    it('should return dimensions of latest frame', () => {
      expect(scene.viewport()).toEqual(Dimensions.create(100, 50));
    });
  });
});
