vi.mock('@vertexvis/stream-api');

import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { StreamApi } from '@vertexvis/stream-api';

import { random } from '../../../testing';
import { fromPbFrameOrThrow, toPbCameraTypeOrThrow } from '../../mappers';
import { Orientation } from '../../types';
import { SceneViewStateLoader } from '../sceneViewStateLoader';

describe('SceneViewStateLoader', () => {
  const sceneId = random.guid();
  const sceneViewId = random.guid();
  const streamApi = new StreamApi();
  const cameraTypeMapper = toPbCameraTypeOrThrow();

  const loader = new SceneViewStateLoader(
    streamApi,
    fromPbFrameOrThrow(Orientation.DEFAULT),
    cameraTypeMapper,
    sceneId,
    sceneViewId,
  );

  describe('applySceneViewState', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    it('applies a scene view state by ID', async () => {
      const sceneViewStateId = random.guid();

      await loader.applySceneViewState(sceneViewStateId);

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
        }),
        true,
      );
      expect(streamApi.flyTo).not.toHaveBeenCalled();
    });

    it('applies a scene view state by ID in an identifier', async () => {
      const sceneViewStateId = random.guid();

      await loader.applySceneViewState({ id: sceneViewStateId });

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
        }),
        true,
      );
      expect(streamApi.flyTo).not.toHaveBeenCalled();
    });

    it('applies a scene view state by supplied ID in an identifier', async () => {
      const sceneViewStateSuppliedId = random.string();

      await loader.applySceneViewState({
        suppliedId: sceneViewStateSuppliedId,
      });

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateSuppliedId: {
            value: sceneViewStateSuppliedId,
          },
        }),
        true,
      );
      expect(streamApi.flyTo).not.toHaveBeenCalled();
    });

    it('animates to a scene view state by ID and waits for the animation by default', async () => {
      const animationId = random.guid();
      const sceneViewStateId = random.guid();

      const flyToSpy = vi.spyOn(streamApi, 'flyTo');
      const eventSpy = vi.spyOn(streamApi, 'onEvent');

      flyToSpy.mockResolvedValueOnce({
        flyTo: {
          animationId: {
            hex: animationId,
          },
        },
      });

      eventSpy.mockImplementationOnce((fn) => {
        fn({
          event: {
            animationCompleted: {
              animationId: {
                hex: animationId,
              },
            },
          },
          sentAtTime: {
            seconds: 1000,
          },
        });

        return {
          dispose: vi.fn(),
        };
      });

      await loader.applySceneViewState(sceneViewStateId, {
        animation: {
          milliseconds: 1000,
        },
      });

      expect(streamApi.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateIdentifier: {
            sceneViewStateId: {
              hex: sceneViewStateId,
            },
          },
        }),
        true,
      );
      expect(streamApi.onEvent).toHaveBeenCalled();
      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
        }),
        true,
      );
    });

    it('animates to a scene view state by ID and skips waiting for the animation', async () => {
      const animationId = random.guid();
      const sceneViewStateId = random.guid();

      const flyToSpy = vi.spyOn(streamApi, 'flyTo');

      flyToSpy.mockResolvedValueOnce({
        flyTo: {
          animationId: {
            hex: animationId,
          },
        },
      });

      await loader.applySceneViewState(sceneViewStateId, {
        animation: {
          milliseconds: 1000,
        },
        waitForAnimation: false,
      });

      expect(streamApi.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateIdentifier: {
            sceneViewStateId: {
              hex: sceneViewStateId,
            },
          },
        }),
        true,
      );
      expect(streamApi.onEvent).not.toHaveBeenCalled();
      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
        }),
        true,
      );
    });
  });

  describe('applyPartialSceneViewState', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    it('applies a partial scene view state by ID', async () => {
      const sceneViewStateId = random.guid();

      await loader.applyPartialSceneViewState(sceneViewStateId, ['selection']);

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_SELECTION,
          ],
        }),
        true,
      );
      expect(streamApi.flyTo).not.toHaveBeenCalled();
    });

    it('applies a partial scene view state by ID in an identifier', async () => {
      const sceneViewStateId = random.guid();

      await loader.applyPartialSceneViewState({ id: sceneViewStateId }, [
        'selection',
      ]);

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_SELECTION,
          ],
        }),
        true,
      );
      expect(streamApi.flyTo).not.toHaveBeenCalled();
    });

    it('applies a partial scene view state by supplied ID in an identifier', async () => {
      const sceneViewStateSuppliedId = random.string();

      await loader.applyPartialSceneViewState(
        {
          suppliedId: sceneViewStateSuppliedId,
        },
        ['selection'],
      );

      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateSuppliedId: {
            value: sceneViewStateSuppliedId,
          },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_SELECTION,
          ],
        }),
        true,
      );
      expect(streamApi.flyTo).not.toHaveBeenCalled();
    });

    it('does not animate to a partial scene view state by ID without camera in the feature list', async () => {
      const animationId = random.guid();
      const sceneViewStateId = random.guid();

      const flyToSpy = vi.spyOn(streamApi, 'flyTo');

      flyToSpy.mockResolvedValueOnce({
        flyTo: {
          animationId: {
            hex: animationId,
          },
        },
      });

      await loader.applyPartialSceneViewState(sceneViewStateId, ['selection'], {
        animation: {
          milliseconds: 1000,
        },
      });

      expect(streamApi.flyTo).not.toHaveBeenCalled();
      expect(streamApi.onEvent).not.toHaveBeenCalled();
      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_SELECTION,
          ],
        }),
        true,
      );
    });

    it('animates to a partial scene view state by ID and waits for the animation by default', async () => {
      const animationId = random.guid();
      const sceneViewStateId = random.guid();

      const flyToSpy = vi.spyOn(streamApi, 'flyTo');
      const eventSpy = vi.spyOn(streamApi, 'onEvent');

      flyToSpy.mockResolvedValueOnce({
        flyTo: {
          animationId: {
            hex: animationId,
          },
        },
      });

      eventSpy.mockImplementationOnce((fn) => {
        fn({
          event: {
            animationCompleted: {
              animationId: {
                hex: animationId,
              },
            },
          },
          sentAtTime: {
            seconds: 1000,
          },
        });

        return {
          dispose: vi.fn(),
        };
      });

      await loader.applyPartialSceneViewState(
        sceneViewStateId,
        ['selection', 'camera'],
        {
          animation: {
            milliseconds: 1000,
          },
        },
      );

      expect(streamApi.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateIdentifier: {
            sceneViewStateId: {
              hex: sceneViewStateId,
            },
          },
        }),
        true,
      );
      expect(streamApi.onEvent).toHaveBeenCalled();
      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_SELECTION,
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_CAMERA,
          ],
        }),
        true,
      );
    });

    it('animates to a partial scene view state by ID and skips waiting for the animation', async () => {
      const animationId = random.guid();
      const sceneViewStateId = random.guid();

      const flyToSpy = vi.spyOn(streamApi, 'flyTo');

      flyToSpy.mockResolvedValueOnce({
        flyTo: {
          animationId: {
            hex: animationId,
          },
        },
      });

      await loader.applyPartialSceneViewState(
        sceneViewStateId,
        ['selection', 'camera'],
        {
          animation: {
            milliseconds: 1000,
          },
          waitForAnimation: false,
        },
      );

      expect(streamApi.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateIdentifier: {
            sceneViewStateId: {
              hex: sceneViewStateId,
            },
          },
        }),
        true,
      );
      expect(streamApi.onEvent).not.toHaveBeenCalled();
      expect(streamApi.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
          sceneViewStateFeatureSubset: [
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_SELECTION,
            vertexvis.protobuf.stream.SceneViewStateFeature
              .SCENE_VIEW_STATE_FEATURE_CAMERA,
          ],
        }),
        true,
      );
    });
  });
});
