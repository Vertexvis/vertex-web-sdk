jest.mock('@vertexvis/stream-api');

import { StreamApi } from '@vertexvis/stream-api';
import { Camera } from '../camera';
import { FrameCamera } from '../../types';
import { Vector3, BoundingBox, Angle } from '@vertexvis/geometry';

describe(Camera, () => {
  const api = new StreamApi();
  const data = FrameCamera.create({ position: Vector3.create(1, 2, 3) });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe(Camera.prototype.fitToBoundingBox, () => {
    describe('when aspect ratio < 1', () => {
      const camera = new Camera(api, 0.5, data);

      it('updates the camera with near and far values scaled relative to the smaller aspect ratio', () => {
        const updatedCamera = camera.fitToBoundingBox(
          BoundingBox.create(Vector3.up(), Vector3.down())
        );
        expect(updatedCamera.position.x).toBeCloseTo(1.419);
        expect(updatedCamera.position.y).toBeCloseTo(2.838);
        expect(updatedCamera.position.z).toBeCloseTo(4.258);
      });
    });
  });

  describe(Camera.prototype.rotateAroundAxis, () => {
    const camera = new Camera(api, 1, { ...data, position: Vector3.back() });

    it('returns camera with position rotated around axis', () => {
      const degrees = Angle.toRadians(90);
      const axis = Vector3.up();

      const result = camera.rotateAroundAxis(degrees, axis);
      expect(result.position.x).toBeCloseTo(1, 5);
      expect(result.position.y).toBeCloseTo(0, 5);
      expect(result.position.z).toBeCloseTo(0, 5);
    });
  });

  describe(Camera.prototype.moveBy, () => {
    const camera = new Camera(api, 1, { ...data, position: Vector3.origin() });

    it('shifts the position and lookat by the given delta', () => {
      const delta = Vector3.right();
      const result = camera.moveBy(delta);
      expect(result).toMatchObject({
        position: Vector3.right(),
        lookAt: Vector3.right(),
      });
    });
  });

  describe(Camera.prototype.viewVector, () => {
    const camera = new Camera(api, 1, { ...data, position: Vector3.forward() });

    it('returns the vector between the position and lookat', () => {
      const viewVector = camera.viewVector();
      expect(viewVector).toEqual(Vector3.back());
    });
  });

  describe(Camera.prototype.render, () => {
    const camera = new Camera(api, 1, { ...data, position: Vector3.forward() });
    (api.replaceCamera as jest.Mock).mockResolvedValue(undefined);

    it('should render using camera', async () => {
      camera.render();
      expect(api.replaceCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            position: Vector3.forward(),
          }),
        })
      );
    });
  });
});
