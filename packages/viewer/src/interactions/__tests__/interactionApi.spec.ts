import { Scene, Camera } from '@vertexvis/graphics3d';
import { Dimensions, Point } from '@vertexvis/geometry';
import { InteractionApi } from '../interactionApi';

describe(InteractionApi, () => {
  const ImageStreamingClientMock = jest.fn().mockImplementation(() => {
    return {
      beginInteraction: jest.fn(),
      endInteraction: jest.fn(),
      replaceCamera: jest.fn(),
    };
  });

  const scene = Scene.create(Camera.create(), Dimensions.create(200, 100));

  const sceneProvider = (): Scene.Scene => scene;
  const cameraProvider = (): Camera.Camera => scene.camera;
  const viewportProvider = (): Dimensions.Dimensions => scene.viewport;
  const fovyProvider = (): number => scene.camera.fovy;
  const emit = jest.fn();
  const stream = new ImageStreamingClientMock();

  let api: InteractionApi;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    api = new InteractionApi(stream, cameraProvider, viewportProvider, fovyProvider, {
      emit,
    });
  });

  describe(InteractionApi.prototype.beginInteraction, () => {
    it('begins interaction on the stream', () => {
      api.beginInteraction();
      expect(stream.beginInteraction).toHaveBeenCalledTimes(1);
    });

    it('does not begin interaction if in interaction state', () => {
      api.beginInteraction();
      api.beginInteraction();
      expect(stream.beginInteraction).toHaveBeenCalledTimes(1);
    });
  });

  describe(InteractionApi.prototype.endInteraction, () => {
    it('ends interaction on stream if interacting', () => {
      api.beginInteraction();
      api.endInteraction();
      expect(stream.endInteraction).toHaveBeenCalledTimes(1);
    });

    it('does not end interaction if not interacting', () => {
      api.endInteraction();
      expect(stream.endInteraction).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.panCamera, () => {
    it('replaces the camera if interacting', () => {
      api.beginInteraction();
      api.panCamera(Point.create(10, 0));
      api.endInteraction();
      expect(stream.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', () => {
      api.panCamera(Point.create(10, 0));
      expect(stream.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.rotateCamera, () => {
    it('replaces the camera if interacting', () => {
      api.beginInteraction();
      api.rotateCamera(Point.create(10, 0));
      api.endInteraction();
      expect(stream.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', () => {
      api.rotateCamera(Point.create(10, 0));
      expect(stream.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.zoomCamera, () => {
    it('replaces the camera if interacting', () => {
      api.beginInteraction();
      api.zoomCamera(1);
      api.endInteraction();
      expect(stream.replaceCamera).toHaveBeenCalledTimes(1);
    });

    it('does nothing if not interacting', () => {
      api.zoomCamera(1);
      expect(stream.replaceCamera).not.toHaveBeenCalled();
    });
  });

  describe(InteractionApi.prototype.tap, () => {
    beforeEach(() => {
      api = new InteractionApi(stream, cameraProvider, viewportProvider, fovyProvider, {
        emit,
      });
    });

    it('emits a tap event', async () => {
      const point = Point.create();
      await api.tap(point);
      expect(emit).toHaveBeenCalledWith({
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
      expect(emit).toHaveBeenCalledWith({
        position: point,
        ...details,
      });
    });
  });
});
