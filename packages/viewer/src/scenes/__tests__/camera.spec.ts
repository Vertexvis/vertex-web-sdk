import { Camera } from '../camera';
import { FrameCamera } from '../../types';
import { UUID } from '@vertexvis/utils';
import { Vector3, BoundingBox, Angle } from '@vertexvis/geometry';

describe(Camera, () => {
  const renderer = jest.fn();
  const data = FrameCamera.create({ position: Vector3.create(1, 2, 3) });
  const boundingBox = BoundingBox.create(Vector3.create(), Vector3.create());

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe(Camera.prototype.fitToBoundingBox, () => {
    describe('when aspect ratio < 1', () => {
      const camera = new Camera(renderer, 0.5, data, boundingBox);

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
    const camera = new Camera(
      renderer,
      1,
      {
        ...data,
        position: Vector3.back(),
      },
      boundingBox
    );

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
    const camera = new Camera(
      renderer,
      1,
      {
        ...data,
        position: Vector3.origin(),
      },
      boundingBox
    );

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
    const camera = new Camera(
      renderer,
      1,
      {
        ...data,
        position: Vector3.forward(),
      },
      boundingBox
    );

    it('returns the vector between the position and lookat', () => {
      const viewVector = camera.viewVector();
      expect(viewVector).toEqual(Vector3.back());
    });
  });

  describe(Camera.prototype.render, () => {
    const camera = new Camera(
      renderer,
      1,
      {
        ...data,
        position: Vector3.forward(),
      },
      boundingBox
    );

    it('should render using camera', async () => {
      camera.render();
      expect(renderer).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            position: Vector3.forward(),
          }),
        })
      );
    });
  });

  describe('render with animations', () => {
    const camera = new Camera(
      renderer,
      1,
      {
        ...data,
        position: Vector3.forward(),
      },
      boundingBox
    );

    it('should render using camera with animations', async () => {
      camera.render({
        animation: {
          milliseconds: 500,
        },
      });

      expect(renderer).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            position: Vector3.forward(),
          }),
          animation: {
            milliseconds: 500,
          },
          flyToOptions: {
            flyTo: {
              data: expect.objectContaining({
                position: Vector3.forward(),
              }),
              type: 'camera',
            },
          },
        })
      );
    });

    it('should support fly to with sceneItemId', async () => {
      const newCamera = new Camera(
        renderer,
        1,
        {
          ...data,
          position: Vector3.forward(),
        },
        boundingBox
      );
      const id = UUID.create();
      newCamera
        .flyTo(q => q.withItemId(id))
        .render({
          animation: {
            milliseconds: 500,
          },
        });

      expect(renderer).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: {
            milliseconds: 500,
          },
          camera: expect.objectContaining({
            position: Vector3.forward(),
          }),
          flyToOptions: {
            flyTo: {
              type: 'internal',
              data: id,
            },
          },
        })
      );
    });

    it('should support fly to suppliedId with animations', async () => {
      camera
        .flyTo(q => q.withSuppliedId('suppliedId'))
        .render({
          animation: {
            milliseconds: 500,
          },
        });

      expect(renderer).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            position: Vector3.forward(),
          }),
          animation: {
            milliseconds: 500,
          },
          flyToOptions: {
            flyTo: {
              data: 'suppliedId',
              type: 'supplied',
            },
          },
        })
      );
    });

    it('should go to the visible bounding box on a viewAll', async () => {
      const newBoundingBox = BoundingBox.create(
        Vector3.create(1, 1, 1),
        Vector3.create(2, 2, 2)
      );
      const newCamera = new Camera(
        renderer,
        1,
        {
          ...data,
          position: Vector3.back(),
        },
        newBoundingBox
      );

      newCamera.viewAll().render();

      expect(renderer).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            lookAt: Vector3.create(1.5, 1.5, 1.5),
            position: Vector3.create(1.5, 1.5, 3.7998473026935273),
            up: Vector3.create(0, 1, 0),
          }),
        })
      );
    });

    it('viewAll should support animations', async () => {
      const newBoundingBox = BoundingBox.create(
        Vector3.create(1, 1, 1),
        Vector3.create(2, 2, 2)
      );
      const newCamera = new Camera(
        renderer,
        1,
        {
          ...data,
          position: Vector3.back(),
        },
        newBoundingBox
      );

      newCamera.viewAll().render({
        animation: {
          milliseconds: 500,
        },
      });

      expect(renderer).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: {
            milliseconds: 500,
          },
          flyToOptions: {
            flyTo: {
              data: expect.objectContaining({
                lookAt: Vector3.create(1.5, 1.5, 1.5),
                position: Vector3.create(1.5, 1.5, 3.7998473026935273),
                up: Vector3.create(0, 1, 0),
              }),
              type: 'camera',
            },
          },
        })
      );
    });
  });
});
