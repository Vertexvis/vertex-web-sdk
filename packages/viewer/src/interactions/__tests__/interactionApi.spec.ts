jest.mock('@vertexvis/stream-api');

import { Scene } from '../../scenes';
import { Point } from '@vertexvis/geometry';
import { InteractionApi } from '../interactionApi';
import { frame } from '../../types/__fixtures__';
import { StreamApi } from '@vertexvis/stream-api';
import { Interactions } from '../../types';
import { ColorMaterial } from '../..';

describe(InteractionApi, () => {
  const emitTap = jest.fn();
  const emitDoubleTap = jest.fn();
  const emitLongPress = jest.fn();
  const streamApi = new StreamApi();
  const sceneViewId = 'scene-view-id';
  const scene = new Scene(
    streamApi,
    frame,
    () => Point.create(1, 1),
    sceneViewId,
    ColorMaterial.fromHex('#ffffff')
  );
  const sceneProvider = (): Scene => scene;
  const depthProvider = (): number => 1;
  const interactionConfigProvider = (): Interactions.InteractionConfig =>
    Interactions.defaultInteractionConfig;

  let api: InteractionApi;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    api = new InteractionApi(
      streamApi,
      interactionConfigProvider,
      sceneProvider,
      depthProvider,
      { emit: emitTap },
      { emit: emitDoubleTap },
      { emit: emitLongPress }
    );
  });

  describe(InteractionApi.prototype.beginInteraction, () => {
    it('begins interaction on the stream', () => {
      api.beginInteraction();
      expect(streamApi.beginInteraction).toHaveBeenCalledTimes(1);
    });

    it('does not begin interaction if in interaction state', () => {
      api.beginInteraction();
      api.beginInteraction();
      expect(streamApi.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(InteractionApi.prototype.endInteraction, () => {
    it('ends interaction on stream if interacting', () => {
      api.beginInteraction();
      api.endInteraction();
      expect(streamApi.endInteraction).toHaveBeenCalledTimes(1);
    });

    it('does not end interaction if not interacting', () => {
      api.endInteraction();
      expect(streamApi.endInteraction).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.panCamera, () => {
    it('replaces the camera if interacting', () => {
      api.beginInteraction();
      api.panCamera(Point.create(10, 0));
      api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', () => {
      api.panCamera(Point.create(10, 0));
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.rotateCamera, () => {
    it('replaces the camera if interacting', () => {
      api.beginInteraction();
      api.rotateCamera(Point.create(10, 0));
      api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', () => {
      api.rotateCamera(Point.create(10, 0));
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.rotateCameraAtPoint, () => {
    it('replaces the camera if interacting', () => {
      api.beginInteraction();
      api.rotateCameraAtPoint(Point.create(10, 0), Point.create(0, 0));
      api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', () => {
      api.rotateCameraAtPoint(Point.create(10, 0), Point.create(0, 0));
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.zoomCamera, () => {
    it('replaces the camera if interacting', () => {
      api.beginInteraction();
      api.zoomCamera(1);
      api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', () => {
      api.zoomCamera(1);
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.twistCamera, () => {
    it('replaces the camera if interacting', () => {
      api.beginInteraction();
      api.twistCamera(Point.create(10, 0));
      api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', () => {
      api.zoomCamera(1);
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.tap, () => {
    beforeEach(() => {
      api = new InteractionApi(
        streamApi,
        interactionConfigProvider,
        sceneProvider,
        depthProvider,
        {
          emit: emitTap,
        },
        {
          emit: emitDoubleTap,
        },
        {
          emit: emitLongPress,
        }
      );
    });

    it('emits a tap event', async () => {
      const point = Point.create();
      await api.tap(point);
      expect(emitTap).toHaveBeenCalledWith({
        position: point,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      });
    });

    it('emits a tap event with correct keyboard details', async () => {
      const point = Point.create();
      const details = {
        altKey: true,
        ctrlKey: true,
        metaKey: true,
        shiftKey: true,
      };

      await api.tap(point, details);
      expect(emitTap).toHaveBeenCalledWith({
        position: point,
        ...details,
      });
    });
  });
});
