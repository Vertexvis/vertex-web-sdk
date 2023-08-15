jest.mock('@vertexvis/stream-api');
jest.mock('../../../workers/png-decoder-pool');

import { EventEmitter } from '@stencil/core';
import { Angle, Dimensions, Point, Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { random } from '../../../testing';
import {
  copyDrawFramePayloadPerspective,
  drawFramePayloadPerspective,
  makePerspectiveFrame,
} from '../../../testing/fixtures';
import { CursorManager } from '../../cursors';
import { fromPbFrameOrThrow } from '../../mappers';
import { Scene } from '../../scenes';
import { Interactions, Orientation, Viewport } from '../../types';
import { Frame } from '../../types/frame';
import { PerspectiveFrameCamera } from '../../types/frameCamera';
import {
  InteractionApi,
  InteractionConfigProvider,
  SceneProvider,
} from '../interactionApi';
import { InteractionApiPerspective } from '../interactionApiPerspective';
import { TapEventDetails } from '../tapEventDetails';

describe(InteractionApi, () => {
  const emitTap = jest.fn();
  const emitDoubleTap = jest.fn();
  const emitLongPress = jest.fn();
  const emitInteractionStarted = jest.fn();
  const emitInteractionFinished = jest.fn();
  const streamApi = new StreamApi();
  const sceneId = random.guid();
  const sceneViewId = random.guid();
  const frame = makePerspectiveFrame();
  const scene = new Scene(
    streamApi,
    frame,
    fromPbFrameOrThrow(Orientation.DEFAULT),
    () => Point.create(1, 1),
    Dimensions.create(50, 50),
    sceneId,
    sceneViewId
  );
  const frameProvider = (): Frame | undefined => frame;
  const sceneProvider = async (): Promise<Scene> => scene;
  const viewportProvider = (): Viewport => new Viewport(100, 100);
  const interactionConfigProvider = (): Interactions.InteractionConfig =>
    Interactions.defaultInteractionConfig;

  let api: InteractionApi;

  function createInteractionApi(
    props: InteractionApiProps = {}
  ): InteractionApiPerspective {
    return new InteractionApiPerspective(
      props.streamApi ?? streamApi,
      props.cursorManager ?? new CursorManager(),
      props.interactionConfigProvider ?? interactionConfigProvider,
      props.sceneProvider ?? sceneProvider,
      props.frameProvider ?? frameProvider,
      props.viewportProvider ?? viewportProvider,
      props.tapEmitter ?? { emit: emitTap },
      props.doubleTapEmitter ?? { emit: emitDoubleTap },
      props.longPressEmitter ?? { emit: emitLongPress },
      props.interactionStartedEmitter ?? { emit: emitInteractionStarted },
      props.interactionFinishedEmitter ?? { emit: emitInteractionFinished }
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    api = createInteractionApi();
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

    it('prevents zooming past the hit point when configured', async () => {
      const configuredApi = createInteractionApi({
        interactionConfigProvider: () => ({
          ...Interactions.defaultInteractionConfig,
          useMinimumPerspectiveZoomDistance: false,
        }),
      });

      await configuredApi.beginInteraction();
      for (let i = 0; i < 100; i++) {
        await configuredApi.zoomCameraToPoint(Point.create(10, 10), 10);
      }
      await configuredApi.endInteraction();

      const lastCall: PerspectiveFrameCamera = (
        streamApi.replaceCamera as jest.Mock
      ).mock.lastCall[0].camera.perspective;

      expect(lastCall.position.z).toBeCloseTo(0);
    });

    it('allows zooming past the hit point', async () => {
      await api.beginInteraction();
      for (let i = 0; i < 100; i++) {
        await api.zoomCameraToPoint(Point.create(10, 10), 10);
      }
      await api.endInteraction();

      const lastCall: PerspectiveFrameCamera = (
        streamApi.replaceCamera as jest.Mock
      ).mock.lastCall[0].camera.perspective;

      expect(lastCall.position.z).not.toBeCloseTo(0);
    });

    it('uses the camera orientation and bounding box to determine zoom speed', async () => {
      const visibleBounds = {
        xmin: -100,
        ymin: -200,
        zmin: -300,
        xmax: 100,
        ymax: 200,
        zmax: 300,
      };
      const closeFrameZ = makePerspectiveFrame(
        copyDrawFramePayloadPerspective(drawFramePayloadPerspective, {
          sceneAttributes: {
            visibleBoundingBox: visibleBounds,
            camera: {
              perspective: {
                position: { x: 0, y: 0, z: 0.25 },
                up: { x: 0, y: 1, z: 0 },
              },
            },
          },
        })
      );
      const closeFrameY = makePerspectiveFrame(
        copyDrawFramePayloadPerspective(drawFramePayloadPerspective, {
          sceneAttributes: {
            visibleBoundingBox: visibleBounds,
            camera: {
              perspective: {
                position: { x: 0, y: 0.25, z: 0 },
                up: { x: 0, y: 0, z: 1 },
              },
            },
          },
        })
      );
      const closeFrameX = makePerspectiveFrame(
        copyDrawFramePayloadPerspective(drawFramePayloadPerspective, {
          sceneAttributes: {
            visibleBoundingBox: visibleBounds,
            camera: {
              perspective: {
                position: { x: 0.25, y: 0, z: 0 },
                up: { x: 0, y: 1, z: 0 },
              },
            },
          },
        })
      );
      const apiCloseX = createInteractionApi({
        sceneProvider: async () =>
          new Scene(
            streamApi,
            closeFrameX,
            fromPbFrameOrThrow(Orientation.DEFAULT),
            () => Point.create(1, 1),
            Dimensions.create(50, 50),
            sceneId,
            sceneViewId
          ),
        frameProvider: () => closeFrameX,
      });

      await apiCloseX.beginInteraction();
      await apiCloseX.zoomCameraToPoint(Point.create(50, 50), 1);
      await apiCloseX.endInteraction();

      const lastCallX: PerspectiveFrameCamera = (
        streamApi.replaceCamera as jest.Mock
      ).mock.lastCall[0].camera.perspective;

      const apiCloseY = createInteractionApi({
        sceneProvider: async () =>
          new Scene(
            streamApi,
            closeFrameY,
            fromPbFrameOrThrow(Orientation.DEFAULT),
            () => Point.create(1, 1),
            Dimensions.create(50, 50),
            sceneId,
            sceneViewId
          ),
        frameProvider: () => closeFrameY,
      });

      await apiCloseY.beginInteraction();
      await apiCloseY.zoomCameraToPoint(Point.create(50, 50), 1);
      await apiCloseY.endInteraction();

      const lastCallY: PerspectiveFrameCamera = (
        streamApi.replaceCamera as jest.Mock
      ).mock.lastCall[0].camera.perspective;

      const apiCloseZ = createInteractionApi({
        sceneProvider: async () =>
          new Scene(
            streamApi,
            closeFrameZ,
            fromPbFrameOrThrow(Orientation.DEFAULT),
            () => Point.create(1, 1),
            Dimensions.create(50, 50),
            sceneId,
            sceneViewId
          ),
        frameProvider: () => closeFrameZ,
      });

      await apiCloseZ.beginInteraction();
      await apiCloseZ.zoomCameraToPoint(Point.create(50, 50), 1);
      await apiCloseZ.endInteraction();

      const lastCallZ: PerspectiveFrameCamera = (
        streamApi.replaceCamera as jest.Mock
      ).mock.lastCall[0].camera.perspective;

      expect(lastCallX.lookAt.x).toBeCloseTo(-7.426);
      expect(lastCallY.lookAt.y).toBeCloseTo(-15.1);
      expect(lastCallZ.lookAt.z).toBeCloseTo(-22.777);
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
      await api.twistCamera(1);
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.pivotCamera, () => {
    it('replaces the camera if interacting', async () => {
      await api.beginInteraction();
      await api.pivotCamera(1, 0);
      await api.endInteraction();

      const expectedLookAt = Vector3.rotateAboutAxis(
        Angle.toRadians(1),
        frame.scene.camera.lookAt,
        Vector3.left(),
        frame.scene.camera.position
      );

      expect(streamApi.replaceCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            perspective: expect.objectContaining({
              lookAt: expect.objectContaining(expectedLookAt),
            }),
          }),
        })
      );
    });

    it('does nothing if not interacting', async () => {
      await api.pivotCamera(10, 10);
      expect(streamApi.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.tap, () => {
    beforeEach(() => {
      api = new InteractionApiPerspective(
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

interface InteractionApiProps {
  streamApi?: StreamApi;
  cursorManager?: CursorManager;
  interactionConfigProvider?: InteractionConfigProvider;
  sceneProvider?: SceneProvider;
  frameProvider?: () => Frame | undefined;
  viewportProvider?: () => Viewport;
  tapEmitter?: EventEmitter<TapEventDetails>;
  doubleTapEmitter?: EventEmitter<TapEventDetails>;
  longPressEmitter?: EventEmitter<TapEventDetails>;
  interactionStartedEmitter?: EventEmitter<void>;
  interactionFinishedEmitter?: EventEmitter<void>;
}
