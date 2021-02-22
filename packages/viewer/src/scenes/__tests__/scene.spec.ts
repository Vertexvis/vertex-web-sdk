jest.mock('@vertexvis/stream-api');

import { Scene } from '../scene';
import { StreamApi } from '@vertexvis/stream-api';
import { Dimensions, Point } from '@vertexvis/geometry';
import { frame } from '../../types/__fixtures__';
import { UUID } from '@vertexvis/utils';
import { ColorMaterial } from '../..';

describe(Scene, () => {
  const renderer = jest.fn();
  const sceneViewId: UUID.UUID = UUID.create();
  const streamApi = new StreamApi();
  const imageScaleProvider = (): Point.Point => Point.create(1, 1);
  const scene = new Scene(
    streamApi,
    renderer,
    frame,
    imageScaleProvider,
    sceneViewId
  );

  afterEach(() => {
    jest.resetAllMocks();
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
      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        operations: [
          {
            item: {
              sceneItemQuery: {
                id: {
                  hex: itemId.toString(),
                },
              },
            },
            operationTypes: [
              {
                changeVisibility: {
                  visible: false,
                },
              },
            ],
          },
        ],
      });
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

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        operations: [
          {
            all: {},
            operationTypes: [
              {
                changeVisibility: {
                  visible: false,
                },
              },
            ],
          },
          {
            or: {
              queries: [
                {
                  sceneItemQuery: {
                    id: {
                      hex: itemId.toString(),
                    },
                  },
                },
                {
                  sceneItemQuery: {
                    suppliedId,
                  },
                },
              ],
            },
            operationTypes: [
              {
                changeVisibility: {
                  visible: true,
                },
              },
            ],
          },
          {
            all: {},
            operationTypes: [
              {
                changeMaterial: {
                  material: {
                    d: 100,
                    ka: {
                      a: 0,
                      b: 0,
                      g: 0,
                      r: 0,
                    },
                    kd: {
                      a: 255,
                      b: 34,
                      g: 17,
                      r: 255,
                    },
                    ke: {
                      a: 0,
                      b: 0,
                      g: 0,
                      r: 0,
                    },
                    ks: {
                      a: 0,
                      b: 0,
                      g: 0,
                      r: 0,
                    },
                    ns: 10,
                  },
                },
              },
            ],
          },
        ],
      });
    });
  });

  describe(Scene.prototype.viewport, () => {
    it('should return dimensions of latest frame', () => {
      expect(scene.viewport()).toEqual(Dimensions.create(100, 50));
    });
  });
});
