jest.mock('@vertexvis/stream-api');
jest.mock('../../../workers/png-decoder-pool');

import {
  Angle,
  BoundingBox,
  Dimensions,
  Point,
  Vector3,
} from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { makeOrthographicFrame } from '../../../testing/fixtures';
import { CursorManager } from '../../cursors';
import { fromPbFrameOrThrow } from '../../mappers';
import { OrthographicCamera, Scene } from '../../scenes';
import * as ColorMaterial from '../../scenes/colorMaterial';
import { FrameCamera, Interactions, Orientation, Viewport } from '../../types';
import { Frame } from '../../types/frame';
import { InteractionApi } from '../interactionApi';
import { InteractionApiOrthographic } from '../interactionApiOrthographic';

describe(InteractionApi, () => {
  const emitTap = jest.fn();
  const emitDoubleTap = jest.fn();
  const emitLongPress = jest.fn();
  const emitInteractionStarted = jest.fn();
  const emitInteractionFinished = jest.fn();
  const streamApi = new StreamApi();
  const sceneViewId = 'scene-view-id';
  const frame = makeOrthographicFrame();
  const scene = new Scene(
    streamApi,
    frame,
    fromPbFrameOrThrow(Orientation.DEFAULT),
    () => Point.create(1, 1),
    Dimensions.create(50, 50),
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
      { emit: emitInteractionFinished }
    );
  });

  describe(InteractionApiOrthographic.prototype.panCameraByDelta, () => {
    it('uses the fovHeight value of the orthographic camera', async () => {
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

      expect(moveBy.mock.calls[0][0].x).toBeCloseTo(-1);
    });
  });
});
