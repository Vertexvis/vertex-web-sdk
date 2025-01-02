jest.mock('@vertexvis/stream-api');

import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions, Point } from '@vertexvis/geometry';
import {
  RequestMessage,
  RequestMessageHandler,
  StreamApi,
} from '@vertexvis/stream-api';
import { Disposable, UUID } from '@vertexvis/utils';

import { random } from '../../../testing';
import {
  drawFramePayloadPerspective,
  makePerspectiveFrame,
} from '../../../testing/fixtures';
import { fromPbFrameOrThrow } from '../../mappers';
import { Orientation, Viewport } from '../../types';
import * as ColorMaterial from '../colorMaterial';
import { Scene } from '../scene';

class MockStreamApi extends StreamApi {
  private requestHandler?: RequestMessageHandler;
  private requestMessage?: RequestMessage;

  public reset(): void {
    this.requestHandler = undefined;
    this.requestMessage = undefined;
  }

  public onRequest(handler: RequestMessageHandler): Disposable {
    this.requestHandler = handler;

    if (this.requestMessage != null) {
      handler(this.requestMessage);
      this.requestMessage = undefined;
    }

    return {
      dispose: () => {
        this.requestHandler = undefined;
        this.requestMessage = undefined;
      },
    };
  }

  public mockReceiveRequest(message: RequestMessage): void {
    if (this.requestHandler != null) {
      this.requestHandler?.(message);
    } else {
      this.requestMessage = message;
    }
  }
}

describe(Scene, () => {
  const sceneId = random.guid();
  const sceneViewId = random.guid();
  const streamApi = new MockStreamApi();
  const imageScaleProvider = (): Point.Point => Point.create(1, 1);
  const viewport = new Viewport(50, 50);
  const scene = new Scene(
    streamApi,
    makePerspectiveFrame(),
    fromPbFrameOrThrow(Orientation.DEFAULT),
    imageScaleProvider,
    viewport,
    sceneId,
    sceneViewId
  );

  afterEach(() => {
    jest.resetAllMocks();

    streamApi.reset();
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
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  item: {
                    sceneItemQuery: {
                      id: {
                        hex: itemId.toString(),
                      },
                    },
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
            }),
          },
        ]),
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
        suppliedCorrelationId: {
          value: suppliedId,
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  item: {
                    sceneItemQuery: {
                      id: {
                        hex: itemId.toString(),
                      },
                    },
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
            }),
          },
        ]),
      });
    });

    it('should support passing withSelected queries', () => {
      scene.items((op) => op.where((q) => q.withSelected()).select()).execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  override: {
                    selection: {},
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
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
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  sceneTreeRange: {
                    end: 19,
                    start: 0,
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('should support passing metadata queries', () => {
      scene
        .items((op) =>
          op.where((q) => q.withMetadata('foo', ['bar', 'baz'], false)).select()
        )
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  metadata: {
                    exactMatch: false,
                    valueFilter: 'foo',
                    keys: ['bar', 'baz'],
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('should support passing visibility queries', () => {
      scene.items((op) => op.where((q) => q.withVisible()).select()).execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  override: {
                    visibility: {
                      visibilityState: true,
                    },
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
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
            .materialOverride(ColorMaterial.fromHex('#ff1122'))
            .setPhantom(true)
            .setEndItem(true),
        ])
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  root: {},
                },
              },
              operationTypes: [
                {
                  changeVisibility: {
                    visible: false,
                  },
                },
              ],
            }),
          },
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  itemCollection: {
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
                },
              },
              operationTypes: [
                {
                  changeVisibility: {
                    visible: true,
                  },
                },
              ],
            }),
          },
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  root: {},
                },
              },
              operationTypes: [
                {
                  changeMaterial: {
                    materialOverride: {
                      colorMaterial: {
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
                },
                {
                  changePhantom: {
                    phantom: true,
                  },
                },
                {
                  changeEndItem: {
                    endItem: true,
                  },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('supports selection', () => {
      const itemId = random.guid();
      scene
        .items((op) => op.where((q) => q.withItemId(itemId)).select())
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  item: {
                    sceneItemQuery: {
                      id: { hex: itemId.toString() },
                    },
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('supports waiting for the alteration to complete if flag is set', async () => {
      const itemId = random.guid();
      const correlationId = random.guid();
      const executePromise = scene
        .items((op) => op.where((q) => q.withItemId(itemId)).select())
        .execute({
          suppliedCorrelationId: correlationId,
          awaitCorrelatedDrawFrame: true,
        });

      streamApi.mockReceiveRequest({
        request: {
          drawFrame: {
            ...drawFramePayloadPerspective,
            frameCorrelationIds: [correlationId],
          },
        },
        sentAtTime: {
          seconds: 1000,
        },
      });

      await expect(executePromise).resolves.not.toThrow();
    });

    it('does not wait for the alteration to complete if flag is not set', async () => {
      const itemId = random.guid();
      const correlationId = random.guid();
      const executePromise = scene
        .items((op) => op.where((q) => q.withItemId(itemId)).select())
        .execute({
          suppliedCorrelationId: correlationId,
        });

      await expect(executePromise).resolves.not.toThrow();
    });
  });

  describe(Scene.prototype.elements, () => {
    it('should execute commands and query by itemId', () => {
      const itemId = random.guid();

      scene
        .elements((op) => op.items.where((q) => q.withItemId(itemId)).hide())
        .execute();
      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  item: {
                    sceneItemQuery: {
                      id: {
                        hex: itemId.toString(),
                      },
                    },
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
            }),
          },
        ]),
      });
    });

    it('should execute commands and query by annotationId', () => {
      const annotationId = random.guid();
      const { msb, lsb } = UUID.toMsbLsb(annotationId);

      scene
        .elements((op) =>
          op.annotations.where((q) => q.withAnnotationId(annotationId)).hide()
        )
        .execute();
      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            pmiAnnotationOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  annotation: {
                    id: {
                      msb: parseFloat(msb),
                      lsb: parseFloat(lsb),
                    },
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
            }),
          },
        ]),
      });
    });

    it('should support passing a supplied correlationId', () => {
      const itemId = random.guid();
      const suppliedId = `SuppliedId-${random.guid()}`;
      scene
        .elements((op) => op.items.where((q) => q.withItemId(itemId)).hide())
        .execute({ suppliedCorrelationId: suppliedId });

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: suppliedId,
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  item: {
                    sceneItemQuery: {
                      id: {
                        hex: itemId.toString(),
                      },
                    },
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
            }),
          },
        ]),
      });
    });

    it('should support passing withSelected queries', () => {
      scene
        .elements((op) => op.items.where((q) => q.withSelected()).select())
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  override: {
                    selection: {},
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('should support passing scene-tree range queries', () => {
      scene
        .elements((op) =>
          op.items
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
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  sceneTreeRange: {
                    end: 19,
                    start: 0,
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('should support passing metadata queries', () => {
      scene
        .elements((op) =>
          op.items
            .where((q) => q.withMetadata('foo', ['bar', 'baz'], false))
            .select()
        )
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  metadata: {
                    exactMatch: false,
                    valueFilter: 'foo',
                    keys: ['bar', 'baz'],
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('should support passing visibility queries', () => {
      scene
        .elements((op) => op.items.where((q) => q.withVisible()).select())
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  override: {
                    visibility: {
                      visibilityState: true,
                    },
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('should support passing multiple operations in one request', () => {
      const itemId = random.guid();
      const suppliedId = random.guid();
      scene
        .elements((op) => [
          op.items.where((q) => q.all()).hide(),
          op.items
            .where((q) => q.withItemId(itemId).or().withSuppliedId(suppliedId))
            .show(),
          op.items
            .where((q) => q.all())
            .materialOverride(ColorMaterial.fromHex('#ff1122'))
            .setPhantom(true)
            .setEndItem(true),
        ])
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  root: {},
                },
              },
              operationTypes: [
                {
                  changeVisibility: {
                    visible: false,
                  },
                },
              ],
            }),
          },
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  itemCollection: {
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
                },
              },
              operationTypes: [
                {
                  changeVisibility: {
                    visible: true,
                  },
                },
              ],
            }),
          },
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  root: {},
                },
              },
              operationTypes: [
                {
                  changeMaterial: {
                    materialOverride: {
                      colorMaterial: {
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
                },
                {
                  changePhantom: {
                    phantom: true,
                  },
                },
                {
                  changeEndItem: {
                    endItem: true,
                  },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('supports selection', () => {
      const itemId = random.guid();
      scene
        .elements((op) => op.items.where((q) => q.withItemId(itemId)).select())
        .execute();

      expect(streamApi.createSceneAlteration).toHaveBeenCalledWith({
        sceneViewId: {
          hex: sceneViewId,
        },
        suppliedCorrelationId: {
          value: expect.any(String),
        },
        elementOperations: expect.arrayContaining([
          {
            sceneItemOperation: expect.objectContaining({
              queryExpression: {
                operand: {
                  item: {
                    sceneItemQuery: {
                      id: { hex: itemId.toString() },
                    },
                  },
                },
              },
              operationTypes: [
                {
                  changeSelection: { selected: true },
                },
              ],
            }),
          },
        ]),
      });
    });

    it('waits for the alteration to complete', async () => {
      const itemId = random.guid();
      const correlationId = random.guid();
      const executePromise = scene
        .elements((op) => op.items.where((q) => q.withItemId(itemId)).select())
        .execute({
          suppliedCorrelationId: correlationId,
        });

      streamApi.mockReceiveRequest({
        request: {
          drawFrame: {
            ...drawFramePayloadPerspective,
            frameCorrelationIds: [correlationId],
          },
        },
        sentAtTime: {
          seconds: 1000,
        },
      });

      await expect(executePromise).resolves.not.toThrow();
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
