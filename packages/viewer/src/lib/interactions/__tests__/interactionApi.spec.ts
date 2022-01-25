jest.mock('@vertexvis/stream-api');
jest.mock('../../../workers/png-decoder-pool');

import { Point } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { makeFrame } from '../../../testing/fixtures';
import { CursorManager } from '../../cursors';
import { fromPbFrameOrThrow } from '../../mappers';
import { Scene } from '../../scenes';
import * as ColorMaterial from '../../scenes/colorMaterial';
import { Interactions, Orientation, Viewport } from '../../types';
import { Frame } from '../../types/frame';
import { InteractionApi } from '../interactionApi';

describe(InteractionApi, () => {
  const emitTap = jest.fn();
  const emitDoubleTap = jest.fn();
  const emitLongPress = jest.fn();
  const emitInteractionStarted = jest.fn();
  const emitInteractionFinished = jest.fn();
  const streamApi = new StreamApi();
  const sceneViewId = 'scene-view-id';
  const frame = makeFrame();
  const scene = new Scene(
    streamApi,
    frame,
    fromPbFrameOrThrow(Orientation.DEFAULT),
    () => Point.create(1, 1),
    sceneViewId,
    ColorMaterial.fromHex('#ffffff')
  );
  const frameProvider = (): Frame | undefined => frame;
  const sceneProvider = (): Scene => scene;
  const viewportProvider = (): Viewport => new Viewport(100, 100);
  const interactionConfigProvider = (): Interactions.InteractionConfig =>
    Interactions.defaultInteractionConfig;

  let api: InteractionApi;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    api = new InteractionApi(
      streamApi,
      new CursorManager(),
      interactionConfigProvider,
      sceneProvider,
      frameProvider,
      viewportProvider,
      { emit: emitTap },
      { emit: emitDoubleTap },
      { emit: emitLongPress },
      { emit: emitInteractionStarted },
      { emit: emitInteractionFinished }
    );
  });

  describe(InteractionApi.prototype.beginInteraction, () => {
    it('begins interaction on the stream', async () => {
      await api.beginInteraction();
      expect(streamApi.beginInteraction).toHaveBeenCalledTimes(1);
      expect(emitInteractionStarted).toHaveBeenCalledTimes(1);
    });

    it('does not begin interaction if in interaction state', async () => {
      await api.beginInteraction();
      await api.beginInteraction();
      expect(streamApi.beginInteraction).toHaveBeenCalledTimes(1);
      expect(emitInteractionStarted).toHaveBeenCalledTimes(1);
    });
  });

  describe(InteractionApi.prototype.endInteraction, () => {
    it('ends interaction on stream if interacting', async () => {
      await api.beginInteraction();
      await api.endInteraction();
      expect(streamApi.endInteraction).toHaveBeenCalledTimes(1);
      expect(emitInteractionFinished).toHaveBeenCalledTimes(1);
    });

    it('does not end interaction if not interacting', async () => {
      await api.endInteraction();
      expect(streamApi.endInteraction).not.toHaveBeenCalled();
      expect(emitInteractionFinished).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.panCameraByDelta, () => {
    it('replaces the camera if interacting', async () => {
      await api.beginInteraction();
      await api.panCameraByDelta(Point.create(10, 0));
      await api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', async () => {
      await api.panCameraByDelta(Point.create(10, 0));
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.viewAll, () => {
    it('replaces the camera', async () => {
      await api.viewAll();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });
  });

  describe(InteractionApi.prototype.rotateCamera, () => {
    it('replaces the camera if interacting', async () => {
      await api.beginInteraction();
      await api.rotateCamera(Point.create(10, 0));
      await api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', async () => {
      await api.rotateCamera(Point.create(10, 0));
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.rotateCameraAtPoint, () => {
    it('replaces the camera if interacting', async () => {
      await api.beginInteraction();
      await api.rotateCameraAtPoint(Point.create(10, 0), Point.create(0, 0));
      await api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', async () => {
      await api.rotateCameraAtPoint(Point.create(10, 0), Point.create(0, 0));
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.zoomCamera, () => {
    it('replaces the camera if interacting', async () => {
      await api.beginInteraction();
      await api.zoomCamera(1);
      await api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', async () => {
      await api.zoomCamera(1);
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.zoomCameraToPoint, () => {
    it('replaces the camera if interacting', async () => {
      await api.beginInteraction();
      await api.zoomCameraToPoint(Point.create(10, 10), 1);
      await api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', async () => {
      await api.zoomCameraToPoint(Point.create(10, 10), 1);
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.twistCamera, () => {
    it('replaces the camera if interacting', async () => {
      await api.beginInteraction();
      await api.twistCamera(Point.create(10, 0));
      await api.endInteraction();
      expect(streamApi.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', async () => {
      await api.zoomCamera(1);
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.tap, () => {
    beforeEach(() => {
      api = new InteractionApi(
        streamApi,
        new CursorManager(),
        interactionConfigProvider,
        sceneProvider,
        frameProvider,
        viewportProvider,
        { emit: emitTap },
        { emit: emitDoubleTap },
        { emit: emitLongPress },
        { emit: emitInteractionStarted },
        { emit: emitInteractionFinished }
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
        buttons: 0,
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
        buttons: 0,
      });
    });

    it('emits a tap event with correct button details', async () => {
      const point = Point.create();
      const details = {
        altKey: true,
        ctrlKey: true,
        metaKey: true,
        shiftKey: true,
      };

      await api.tap(point, details, 2);
      expect(emitTap).toHaveBeenCalledWith({
        position: point,
        ...details,
        buttons: 2,
      });
    });
  });
});
