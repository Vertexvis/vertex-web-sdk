jest.mock('@vertexvis/stream-api');
jest.mock('../../../workers/png-decoder-pool');

import {
  Angle,
  BoundingBox,
  Dimensions,
  Point,
  Ray,
  Vector3,
} from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { random } from '../../../testing';
import { makeOrthographicFrame } from '../../../testing/fixtures';
import { CursorManager } from '../../cursors';
import { fromPbFrameOrThrow, toPbCameraTypeOrThrow } from '../../mappers';
import { OrthographicCamera, Scene } from '../../scenes';
import {
  DepthBuffer,
  FrameCamera,
  Interactions,
  Orientation,
  Viewport,
} from '../../types';
import { Frame } from '../../types/frame';
import { InteractionApi } from '../interactionApi';
import { InteractionApiOrthographic } from '../interactionApiOrthographic';

describe(InteractionApiOrthographic, () => {
  const emitTap = jest.fn();
  const emitDoubleTap = jest.fn();
  const emitLongPress = jest.fn();
  const emitInteractionStarted = jest.fn();
  const emitInteractionFinished = jest.fn();
  const emitCameraChanged = jest.fn();
  const streamApi = new StreamApi();
  const sceneId = random.guid();
  const sceneViewId = random.guid();
  const frame = makeOrthographicFrame();
  const viewport = new Viewport(100, 100);
  const cameraTypeMapper = toPbCameraTypeOrThrow();

  const scene = new Scene(
    streamApi,
    frame,
    fromPbFrameOrThrow(Orientation.DEFAULT),
    cameraTypeMapper,
    () => Point.create(1, 1),
    Dimensions.create(50, 50),
    sceneId,
    sceneViewId
  );
  const frameProvider = (): Frame | undefined => frame;
  const sceneProvider = (): Scene => scene;
  const viewportProvider = (): Viewport => viewport;
  const interactionConfigProvider = (): Interactions.InteractionConfig =>
    Interactions.defaultInteractionConfig;

  let api: InteractionApi;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    api = new InteractionApiOrthographic(
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
      { emit: emitInteractionFinished },
      { emit: emitCameraChanged }
    );
  });

  describe(
    InteractionApiOrthographic.prototype.getWorldPointFromViewport,
    () => {
      it('uses an orthographic ray to determine a world point', async () => {
        const depthBuffer = (await frame.depthBuffer()) as DepthBuffer;
        jest.spyOn(depthBuffer, 'getDepthAtPoint').mockImplementation(() => 0);

        const expectedRay = viewport.transformPointToRay(
          Point.create(1, 1),
          frame.image,
          frame.scene.camera
        );

        expect(
          await api.getWorldPointFromViewport(Point.create(1, 1))
        ).toMatchObject(Ray.at(expectedRay, 0));
      });
    }
  );

  describe(InteractionApiOrthographic.prototype.panCameraByDelta, () => {
    it('uses the view vector of the orthographic camera', async () => {
      const data = FrameCamera.createOrthographic({
        fovHeight: Angle.toRadians(135),
      });
      const mockOrthographicCamera = new OrthographicCamera(
        streamApi,
        1,
        data,
        BoundingBox.create(Vector3.create(), Vector3.create(50, 50, 50)),
        fromPbFrameOrThrow(Orientation.DEFAULT)
      );
      jest
        .spyOn(scene, 'camera')
        .mockImplementation(() => mockOrthographicCamera);
      const moveBy = jest.spyOn(mockOrthographicCamera, 'moveBy');

      await api.beginInteraction();
      await api.panCameraByDelta(
        Point.create(frame.image.imageAttr.frameDimensions.width, 0)
      );
      await api.endInteraction();

      expect(moveBy.mock.calls[0][0].x).toBeCloseTo(0.5);
    });
  });

  describe(InteractionApiOrthographic.prototype.panCameraToScreenPoint, () => {
    it('changes the lookAt of the orthographic camera', async () => {
      const data = FrameCamera.createOrthographic();
      const mockOrthographicCamera = new OrthographicCamera(
        streamApi,
        1,
        data,
        BoundingBox.create(Vector3.create(), Vector3.create(50, 50, 50)),
        fromPbFrameOrThrow(Orientation.DEFAULT)
      );
      jest
        .spyOn(scene, 'camera')
        .mockImplementation(() => mockOrthographicCamera);
      const update = jest
        .spyOn(mockOrthographicCamera, 'update')
        .mockImplementation(() => mockOrthographicCamera);

      await api.beginInteraction();
      await api.panCameraToScreenPoint(
        Point.create(frame.image.imageAttr.frameDimensions.width, 0)
      );
      await api.panCameraToScreenPoint(Point.create(0, 0));
      await api.endInteraction();

      expect(update).toHaveBeenCalledTimes(2);
      expect(update.mock.calls[1][0].lookAt).toMatchObject({
        x: -1,
        y: 0,
        z: expect.closeTo(25, 5),
      });
    });
  });

  describe(InteractionApiOrthographic.prototype.zoomCameraToPoint, () => {
    it('changes the fovHeight and lookAt of the orthographic camera', async () => {
      const data = FrameCamera.createOrthographic();
      const mockOrthographicCamera = new OrthographicCamera(
        streamApi,
        1,
        data,
        BoundingBox.create(Vector3.create(), Vector3.create(50, 50, 50)),
        fromPbFrameOrThrow(Orientation.DEFAULT)
      );
      jest
        .spyOn(scene, 'camera')
        .mockImplementation(() => mockOrthographicCamera);
      const update = jest.spyOn(mockOrthographicCamera, 'update');

      await api.beginInteraction();
      await api.zoomCameraToPoint(
        Point.create(frame.image.imageAttr.frameDimensions.width, 0),
        -100
      );
      await api.endInteraction();

      expect(update.mock.calls[0][0].lookAt?.x).toBeCloseTo(2);
      expect(update.mock.calls[0][0].lookAt?.y).toBeCloseTo(-2);
      expect(update.mock.calls[0][0].lookAt?.z).toBe(0);
      expect(
        (update.mock.calls[0][0] as FrameCamera.OrthographicFrameCamera)
          .fovHeight
      ).toBe(5);
    });
  });

  describe(InteractionApiOrthographic.prototype.rotateCamera, () => {
    it('changes the fovHeight and lookAt of the orthographic camera', async () => {
      const data = FrameCamera.createOrthographic();
      const mockOrthographicCamera = new OrthographicCamera(
        streamApi,
        1,
        data,
        BoundingBox.create(Vector3.create(), Vector3.create(50, 50, 100)),
        fromPbFrameOrThrow(Orientation.DEFAULT)
      );
      jest
        .spyOn(scene, 'camera')
        .mockImplementation(() => mockOrthographicCamera);
      const update = jest.spyOn(mockOrthographicCamera, 'update');

      await api.beginInteraction();
      await api.rotateCamera(Point.create(10, 0));
      await api.endInteraction();

      expect(update.mock.calls[0][0].lookAt?.x).toBeCloseTo(0);
      expect(update.mock.calls[0][0].lookAt?.y).toBeCloseTo(0);
      expect(update.mock.calls[0][0].lookAt?.z).toBe(0);
    });
  });
});
