jest.mock('@vertexvis/stream-api');

import { Dimensions, Point } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { makePerspectiveFrame } from '../../../testing/fixtures';
import { fromPbFrameOrThrow } from '../../mappers';
import { Orientation, Viewport } from '../../types';
import * as ColorMaterial from '../colorMaterial';
import { Scene } from '../scene';

describe(Scene, () => {
  const sceneViewId: UUID.UUID = UUID.create();
  const streamApi = new StreamApi();
  const imageScaleProvider = (): Point.Point => Point.create(1, 1);
  const viewport = new Viewport(50, 50);
  const colorMaterial = ColorMaterial.fromHex('#ff0000');
  const scene = new Scene(
    streamApi,
    makePerspectiveFrame(),
    fromPbFrameOrThrow(Orientation.DEFAULT),
    imageScaleProvider,
    viewport,
    sceneViewId,
    colorMaterial
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

      scene
        .items((op) => op.where((q) => q.withItemId(itemId)).hide())
        .execute();
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

    it('should support passing a supplied correlationId', () => {
      const itemId = UUID.create();
      const suppliedId = `SuppliedId-${UUID.create()}`;
      scene
        .items((op) => op.where((q) => q.withItemId(itemId)).hide())
        .execute({ suppliedCorrelationId: suppliedId });

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
        suppliedCorrelationId: {
          value: suppliedId,
        },
      });
    });

    it('should support passing withSelected queries', () => {
      scene.items((op) => op.where((q) => q.withSelected()).select()).execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        operations: [
          {
            override: {
              selection: {},
            },
            operationTypes: [
              {
                changeSelection: {
                  material: expect.objectContaining({
                    kd: colorMaterial.diffuse,
                  }),
                },
              },
            ],
          },
        ],
      });
    });

    it('should support passing scene-tree range queries', () => {
      scene
        .items((op) =>
          op
            .where((q) =>
              q.withSceneTreeRange({
                start: 0,
                end: 19,
              })
            )
            .select()
        )
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        operations: [
          {
            sceneTreeRange: {
              end: 19,
              start: 0,
            },
            operationTypes: [
              {
                changeSelection: {
                  material: expect.objectContaining({
                    kd: colorMaterial.diffuse,
                  }),
                },
              },
            ],
          },
        ],
      });
    });

    it('should support passing metadata queries', () => {
      scene
        .items((op) =>
          op.where((q) => q.withMetadata('foo', ['bar', 'baz'])).select()
        )
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        operations: [
          {
            metadata: {
              valueFilter: 'foo',
              keys: ['bar', 'baz'],
            },
            operationTypes: [
              {
                changeSelection: {
                  material: expect.objectContaining({
                    kd: colorMaterial.diffuse,
                  }),
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
        .items((op) => [
          op.where((q) => q.all()).hide(),
          op
            .where((q) => q.withItemId(itemId).or().withSuppliedId(suppliedId))
            .show(),
          op
            .where((q) => q.all())
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

    it('uses default selection material if color is not specified', () => {
      const itemId = UUID.create();
      scene
        .items((op) => op.where((q) => q.withItemId(itemId)).select())
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        operations: [
          {
            item: {
              sceneItemQuery: {
                id: { hex: itemId.toString() },
              },
            },
            operationTypes: [
              {
                changeSelection: {
                  material: expect.objectContaining({
                    kd: colorMaterial.diffuse,
                  }),
                },
              },
            ],
          },
        ],
      });
    });

    it('selection uses specified material', () => {
      const itemId = UUID.create();
      const material = ColorMaterial.fromHex('#0000ff');
      scene
        .items((op) => op.where((q) => q.withItemId(itemId)).select(material))
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        operations: [
          {
            item: {
              sceneItemQuery: {
                id: { hex: itemId.toString() },
              },
            },
            operationTypes: [
              {
                changeSelection: {
                  material: expect.objectContaining({
                    kd: material.diffuse,
                  }),
                },
              },
            ],
          },
        ],
      });
    });

    it('selection uses hex color', () => {
      const itemId = UUID.create();
      const material = ColorMaterial.fromHex('#0000ff');
      scene
        .items((op) => op.where((q) => q.withItemId(itemId)).select('#0000ff'))
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        operations: [
          {
            item: {
              sceneItemQuery: {
                id: { hex: itemId.toString() },
              },
            },
            operationTypes: [
              {
                changeSelection: {
                  material: expect.objectContaining({
                    kd: material.diffuse,
                  }),
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

  describe(Scene.prototype.crossSectioning, () => {
    it('should return crossSectioner', () => {
      const cs = scene.crossSectioning();
      const frame = makePerspectiveFrame();

      expect(cs.current()).toEqual(frame.scene.crossSection);
    });
  });

  describe(Scene.prototype.reset, () => {
    it('should reset w/o updating the camera', async () => {
      await scene.reset({ suppliedCorrelationId: 'foo' });

      expect(streamApi.resetSceneView).toHaveBeenCalledWith(
        {
          frameCorrelationId: { value: 'foo' },
          includeCamera: undefined,
        },
        true
      );
    });

    it('should reset with updating the camera', async () => {
      await scene.reset({ suppliedCorrelationId: 'foo', includeCamera: true });

      expect(streamApi.resetSceneView).toHaveBeenCalledWith(
        {
          frameCorrelationId: { value: 'foo' },
          includeCamera: true,
        },
        true
      );
    });
  });
});
