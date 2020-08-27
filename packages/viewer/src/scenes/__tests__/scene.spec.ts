import { Scene } from '../scene';
import { StreamApi } from '@vertexvis/stream-api';
import { Dimensions } from '@vertexvis/geometry';
import { frame } from '../../types/__fixtures__';
import { CommandRegistry } from '../../commands/commandRegistry';
import { UUID } from '@vertexvis/utils';
import { ColorMaterial } from '../..';

describe(Scene, () => {
  const executeMock = jest.fn();
  const commandRegistry = ({
    execute: executeMock,
  } as unknown) as CommandRegistry;
  const sceneViewId: UUID.UUID = UUID.create();
  const scene = new Scene(new StreamApi(), frame, commandRegistry, sceneViewId);

  afterEach(() => {
    executeMock.mockReset();
  });

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

  describe(Scene.prototype.items, () => {
    it('should execute commands and query by itemId', () => {
      const itemId = UUID.create();
      scene.items(op => op.where(q => q.withItemId(itemId)).hide()).execute();
      expect(executeMock).toHaveBeenCalled();
      expect(executeMock).toHaveBeenCalledWith(
        'stream.createSceneAlteration',
        sceneViewId,
        [
          {
            operations: [
              {
                type: 'hide',
              },
            ],
            query: {
              type: 'item-id',
              value: itemId,
            },
          },
        ]
      );
    });

    it('should support passing multiple operations in one request', () => {
      const itemId = UUID.create();
      const suppliedId = UUID.create();
      scene
        .items(op => [
          op.where(q => q.all()).hide(),
          op
            .where(q =>
              q
                .withItemId(itemId)
                .or()
                .withSuppliedId(suppliedId)
            )
            .show(),
          op
            .where(q => q.all())
            .materialOverride(ColorMaterial.fromHex('#ff1122')),
        ])
        .execute();
      expect(executeMock).toHaveBeenCalled();
      expect(executeMock).toHaveBeenCalledWith(
        'stream.createSceneAlteration',
        sceneViewId,
        [
          {
            operations: [
              {
                type: 'hide',
              },
            ],
            query: {
              type: 'all',
            },
          },
          {
            operations: [
              {
                type: 'show',
              },
            ],
            query: {
              expressions: [
                {
                  type: 'item-id',
                  value: itemId,
                },
                {
                  type: 'supplied-id',
                  value: suppliedId,
                },
              ],
              type: 'or',
            },
          },
          {
            operations: [
              {
                color: {
                  ambient: {
                    a: 0,
                    b: 0,
                    g: 0,
                    r: 0,
                  },
                  diffuse: {
                    a: 255,
                    b: 34,
                    g: 17,
                    r: 255,
                  },
                  emissive: {
                    a: 0,
                    b: 0,
                    g: 0,
                    r: 0,
                  },
                  specular: {
                    a: 0,
                    b: 0,
                    g: 0,
                    r: 0,
                  },
                  glossiness: 10,
                  opacity: 100,
                },
                type: 'change-material',
              },
            ],
            query: {
              type: 'all',
            },
          },
        ]
      );
    });
  });

  describe(Scene.prototype.viewport, () => {
    it('should return dimensions of latest frame', () => {
      expect(scene.viewport()).toEqual(Dimensions.create(100, 50));
    });
  });
});
