jest.mock('@vertexvis/stream-api');

import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions, Point } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { random } from '../../../testing';
import { makePerspectiveFrame } from '../../../testing/fixtures';
import { fromPbFrameOrThrow } from '../../mappers';
import { Orientation, Viewport } from '../../types';
import * as ColorMaterial from '../colorMaterial';
import { Scene } from '../scene';

describe(Scene, () => {
  const sceneId = random.guid();
  const sceneViewId = random.guid();
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
    sceneId,
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
      const itemId = random.guid();

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
      const itemId = random.guid();
      const suppliedId = `SuppliedId-${random.guid()}`;
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
      const itemId = random.guid();
      const suppliedId = random.guid();
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
                    d: 255,
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
                    ns: ColorMaterial.defaultColor.glossiness,
                  },
                },
              },
            ],
          },
        ],
      });
    });

    it('uses default selection material if color is not specified', () => {
      const itemId = random.guid();
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
      const itemId = random.guid();
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
      const itemId = random.guid();
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

  describe(Scene.prototype.applySceneViewState, () => {
    it('should applySceneViewState', async () => {
      const mockSceneViewStateId = UUID.create();
      await scene.applySceneViewState(mockSceneViewStateId, {
        suppliedCorrelationId: 'foo',
      });

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        {
          sceneViewStateId: { hex: mockSceneViewStateId },
          frameCorrelationId: { value: 'foo' },
        },
        true
      );
    });

    it('should support supplied ids', async () => {
      await scene.applySceneViewState(
        { suppliedId: 'supplied-id' },
        {
          suppliedCorrelationId: 'foo',
        }
      );

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        {
          sceneViewStateSuppliedId: { value: 'supplied-id' },
          frameCorrelationId: { value: 'foo' },
        },
        true
      );
    });

    it('should support object-based ids', async () => {
      const mockSceneViewStateId = UUID.create();
      await scene.applySceneViewState(
        { id: mockSceneViewStateId },
        {
          suppliedCorrelationId: 'foo',
        }
      );

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        {
          sceneViewStateId: { hex: mockSceneViewStateId },
          frameCorrelationId: { value: 'foo' },
        },
        true
      );
    });
  });

  describe(Scene.prototype.applyPartialSceneViewState, () => {
    it('should applyPartialSceneViewState', async () => {
      const mockSceneViewStateId = UUID.create();
      await scene.applyPartialSceneViewState(mockSceneViewStateId, ['camera'], {
        suppliedCorrelationId: 'foo',
      });

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        {
          sceneViewStateId: { hex: mockSceneViewStateId },
          frameCorrelationId: { value: 'foo' },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_CAMERA,
          ],
        },
        true
      );
    });

    it('should support supplied ids', async () => {
      await scene.applyPartialSceneViewState(
        { suppliedId: 'supplied-id' },
        ['camera'],
        {
          suppliedCorrelationId: 'foo',
        }
      );

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        {
          sceneViewStateSuppliedId: { value: 'supplied-id' },
          frameCorrelationId: { value: 'foo' },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_CAMERA,
          ],
        },
        true
      );
    });

    it('should support object-based ids', async () => {
      const mockSceneViewStateId = UUID.create();
      await scene.applyPartialSceneViewState(
        { id: mockSceneViewStateId },
        ['camera'],
        {
          suppliedCorrelationId: 'foo',
        }
      );

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        {
          sceneViewStateId: { hex: mockSceneViewStateId },
          frameCorrelationId: { value: 'foo' },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_CAMERA,
          ],
        },
        true
      );
    });
  });
});
