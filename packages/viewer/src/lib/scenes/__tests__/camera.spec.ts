const realApi = jest.requireActual('@vertexvis/stream-api');
jest.mock('@vertexvis/stream-api');

import { Angle, BoundingBox, Vector3 } from '@vertexvis/geometry';
import { StreamApi, toProtoDuration } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { FrameCamera } from '../../types';
import { OrthographicCamera, PerspectiveCamera } from '../camera';

describe(PerspectiveCamera, () => {
  const stream = new StreamApi();
  const data = FrameCamera.createPerspective({
    position: Vector3.create(1, 2, 3),
  });
  const boundingBox = BoundingBox.create(Vector3.create(), Vector3.create());

  beforeAll(() => {
    stream.flyTo = jest.fn(async () => ({ flyTo: {} }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (toProtoDuration as any).mockImplementation(realApi.toProtoDuration);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe(PerspectiveCamera.prototype.fitToBoundingBox, () => {
    describe('when aspect ratio < 1', () => {
      const camera = new PerspectiveCamera(
        stream,
        0.5,
        data,
        boundingBox,
        jest.fn()
      );

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

  describe(PerspectiveCamera.prototype.distanceToBoundingBoxCenter, () => {
    const forward = FrameCamera.createPerspective({
      position: { x: 0, y: 0, z: 5 },
    });
    const camera = new PerspectiveCamera(
      stream,
      0.5,
      forward,
      boundingBox,
      jest.fn()
    );

    it('computes the distance to the center of the provided bounding box', () => {
      const distance = camera.distanceToBoundingBoxCenter(boundingBox);

      expect(distance).toBeCloseTo(5);
    });
  });

  describe(PerspectiveCamera.prototype.rotateAroundAxis, () => {
    const camera = new PerspectiveCamera(
      stream,
      1,
      {
        ...data,
        position: Vector3.back(),
      },
      boundingBox,
      jest.fn()
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

  describe(PerspectiveCamera.prototype.rotateAroundAxisAtPoint, () => {
    const camera = new PerspectiveCamera(
      stream,
      1,
      {
        ...data,
        position: Vector3.back(),
      },
      boundingBox,
      jest.fn()
    );

    it('returns camera with position rotated around axis', () => {
      const degrees = Angle.toRadians(90);
      const axis = Vector3.up();

      const result = camera.rotateAroundAxisAtPoint(
        degrees,
        Vector3.origin(),
        axis
      );
      expect(result.position.x).toBeCloseTo(1, 5);
      expect(result.position.y).toBeCloseTo(0, 5);
      expect(result.position.z).toBeCloseTo(0, 5);
    });
  });

  describe(PerspectiveCamera.prototype.moveBy, () => {
    const camera = new PerspectiveCamera(
      stream,
      1,
      {
        ...data,
        position: Vector3.origin(),
      },
      boundingBox,
      jest.fn()
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

  describe('viewVector', () => {
    const camera = new PerspectiveCamera(
      stream,
      1,
      {
        ...data,
        position: Vector3.forward(),
      },
      boundingBox,
      jest.fn()
    );

    it('returns the vector between the position and lookat', () => {
      const viewVector = camera.viewVector;
      expect(viewVector).toEqual(Vector3.back());
    });
  });

  describe(PerspectiveCamera.prototype.render, () => {
    const camera = new PerspectiveCamera(
      stream,
      1,
      {
        ...data,
        position: Vector3.forward(),
      },
      boundingBox,
      jest.fn()
    );

    it('should render using camera', async () => {
      camera.render();
      expect(stream.replaceCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            perspective: expect.objectContaining({
              position: Vector3.forward(),
            }),
          }),
        })
      );
    });
  });

  describe('render with animations', () => {
    const camera = new PerspectiveCamera(
      stream,
      1,
      {
        ...data,
        position: Vector3.forward(),
      },
      boundingBox,
      jest.fn()
    );

    it('should render using camera with animations', async () => {
      await camera.render({
        animation: {
          milliseconds: 500,
        },
      });

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            perspective: expect.objectContaining({
              position: Vector3.forward(),
            }),
          }),
          animation: {
            duration: { nanos: 500000000, seconds: 0 },
          },
        }),
        true
      );
    });

    it('should support fly to with sceneItemId', async () => {
      const id = UUID.create();
      camera
        .flyTo((q) => q.withItemId(id))
        .render({
          animation: {
            milliseconds: 500,
          },
        });

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: {
            hex: id,
          },
          animation: {
            duration: { nanos: 500000000, seconds: 0 },
          },
        }),
        true
      );
    });

    it('should support fly to suppliedId with animations', async () => {
      camera
        .flyTo((q) => q.withSuppliedId('suppliedId'))
        .render({
          animation: {
            milliseconds: 500,
          },
        });

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          itemSuppliedId: 'suppliedId',
          animation: {
            duration: { nanos: 500000000, seconds: 0 },
          },
        }),
        true
      );
    });

    it('renders with fly to item id param', async () => {
      await camera.flyTo({ itemId: 'item-id' }).render();

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: {
            hex: 'item-id',
          },
        }),
        true
      );
    });

    it('renders with fly to bounding box param', async () => {
      const boundingBox = BoundingBox.create(
        Vector3.create(-1, -1, -1),
        Vector3.create(1, 1, 1)
      );
      await camera.flyTo({ boundingBox }).render();

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          boundingBox: {
            xmin: boundingBox.min.x,
            ymin: boundingBox.min.y,
            zmin: boundingBox.min.z,
            xmax: boundingBox.max.x,
            ymax: boundingBox.max.y,
            zmax: boundingBox.max.z,
          },
        }),
        true
      );
    });

    it('renders with fly to camera param', async () => {
      const data = FrameCamera.createPerspective();
      await camera.flyTo({ camera: data }).render();

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: FrameCamera.toProtobuf(data),
        }),
        true
      );
    });

    it('should go to the visible bounding box on a viewAll', async () => {
      const newBoundingBox = BoundingBox.create(
        Vector3.create(1, 1, 1),
        Vector3.create(2, 2, 2)
      );
      const newCamera = new PerspectiveCamera(
        stream,

        1,
        {
          ...data,
          position: Vector3.back(),
        },
        newBoundingBox,
        jest.fn()
      );

      await newCamera.viewAll().render();

      expect(stream.replaceCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            perspective: expect.objectContaining({
              lookAt: Vector3.create(1.5, 1.5, 1.5),
              position: Vector3.create(1.5, 1.5, 3.7998473026935273),
              up: Vector3.create(0, 1, 0),
            }),
          }),
        })
      );
    });

    it('viewAll should support animations', async () => {
      const newBoundingBox = BoundingBox.create(
        Vector3.create(1, 1, 1),
        Vector3.create(2, 2, 2)
      );
      const newCamera = new PerspectiveCamera(
        stream,

        1,
        {
          ...data,
          position: Vector3.back(),
        },
        newBoundingBox,
        jest.fn()
      );

      await newCamera.viewAll().render({
        animation: {
          milliseconds: 500,
        },
      });

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: {
            duration: { nanos: 500000000, seconds: 0 },
          },
          camera: expect.objectContaining({
            perspective: expect.objectContaining({
              lookAt: Vector3.create(1.5, 1.5, 1.5),
              position: Vector3.create(1.5, 1.5, 3.7998473026935273),
              up: Vector3.create(0, 1, 0),
            }),
          }),
        }),
        true
      );
    });

    it('should compute near and far clipping planes correctly', () => {
      const newBoundingBox = BoundingBox.create(
        Vector3.create(-1, -1, -1),
        Vector3.create(1, 1, 1)
      );
      const boundingBoxCenter = BoundingBox.center(newBoundingBox);
      const centerToBoundingPlane = Vector3.subtract(
        newBoundingBox.max,
        boundingBoxCenter
      );
      const radius = 1.1 * Vector3.magnitude(centerToBoundingPlane);

      const newCamera = new PerspectiveCamera(
        stream,

        1,
        {
          ...data,
          position: Vector3.create(0, 0, 1),
          lookAt: Vector3.origin(),
        },
        newBoundingBox,
        jest.fn()
      );

      expect(newCamera.far).toBe(1 + radius);
      expect(newCamera.near).toBe((1 + radius) * 0.01);
    });
  });
});

describe(OrthographicCamera, () => {
  const stream = new StreamApi();
  const data = FrameCamera.createOrthographic({
    viewVector: Vector3.create(-1, -2, -3),
  });
  const boundingBox = BoundingBox.create(Vector3.create(), Vector3.create());

  beforeAll(() => {
    stream.flyTo = jest.fn(async () => ({ flyTo: {} }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (toProtoDuration as any).mockImplementation(realApi.toProtoDuration);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe(OrthographicCamera.prototype.fitToBoundingBox, () => {
    describe('when aspect ratio < 1', () => {
      const camera = new OrthographicCamera(
        stream,
        0.5,
        data,
        boundingBox,
        jest.fn()
      );

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

  describe(OrthographicCamera.prototype.distanceToBoundingBoxCenter, () => {
    const forward = FrameCamera.createOrthographic({
      viewVector: { x: 0, y: 0, z: -5 },
    });
    const camera = new OrthographicCamera(
      stream,
      0.5,
      forward,
      boundingBox,
      jest.fn()
    );

    it('computes the distance to the center of the provided bounding box', () => {
      const distance = camera.distanceToBoundingBoxCenter(boundingBox);

      expect(distance).toBeCloseTo(5);
    });
  });

  describe(OrthographicCamera.prototype.rotateAroundAxis, () => {
    const camera = new OrthographicCamera(
      stream,
      1,
      {
        ...data,
        viewVector: Vector3.back(),
      },
      boundingBox,
      jest.fn()
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

  describe(OrthographicCamera.prototype.rotateAroundAxisAtPoint, () => {
    const camera = new OrthographicCamera(
      stream,
      1,
      {
        ...data,
        viewVector: Vector3.back(),
      },
      boundingBox,
      jest.fn()
    );

    it('returns camera with position rotated around axis', () => {
      const degrees = Angle.toRadians(90);
      const axis = Vector3.up();

      const result = camera.rotateAroundAxisAtPoint(
        degrees,
        Vector3.origin(),
        axis
      );
      expect(result.position.x).toBeCloseTo(1, 5);
      expect(result.position.y).toBeCloseTo(0, 5);
      expect(result.position.z).toBeCloseTo(0, 5);
    });
  });

  describe(OrthographicCamera.prototype.moveBy, () => {
    const camera = new OrthographicCamera(
      stream,
      1,
      {
        ...data,
        viewVector: Vector3.origin(),
      },
      boundingBox,
      jest.fn()
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

  describe('position', () => {
    const camera = new OrthographicCamera(
      stream,
      1,
      {
        ...data,
        viewVector: Vector3.forward(),
      },
      boundingBox,
      jest.fn()
    );

    it('returns the position vector described by the lookAt and viewVector', () => {
      const position = camera.position;
      expect(position).toEqual(Vector3.back());
    });
  });

  describe(OrthographicCamera.prototype.toFrameCamera, () => {
    it('creates an orthographic frame camera', () => {
      expect(
        new OrthographicCamera(
          stream,
          1,
          {
            viewVector: Vector3.forward(),
            up: Vector3.up(),
            lookAt: Vector3.origin(),
            fovHeight: 90,
          },
          boundingBox,
          jest.fn()
        ).toFrameCamera()
      ).toMatchObject(
        expect.objectContaining({
          left: -45,
          right: 45,
          bottom: -45,
          top: 45,
          up: Vector3.up(),
          lookAt: Vector3.origin(),
          fovHeight: 90,
        })
      );
    });
  });

  describe(OrthographicCamera.prototype.render, () => {
    const camera = new OrthographicCamera(
      stream,
      1,
      {
        ...data,
        viewVector: Vector3.forward(),
      },
      boundingBox,
      jest.fn()
    );

    it('should render using camera', async () => {
      camera.render();
      expect(stream.replaceCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            orthographic: expect.objectContaining({
              viewVector: Vector3.forward(),
            }),
          }),
        })
      );
    });
  });

  describe('render with animations', () => {
    const camera = new OrthographicCamera(
      stream,
      1,
      {
        ...data,
        viewVector: Vector3.forward(),
      },
      boundingBox,
      jest.fn()
    );

    it('should render using camera with animations', async () => {
      await camera.render({
        animation: {
          milliseconds: 500,
        },
      });

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            orthographic: expect.objectContaining({
              viewVector: Vector3.forward(),
            }),
          }),
          animation: {
            duration: { nanos: 500000000, seconds: 0 },
          },
        }),
        true
      );
    });

    it('should support fly to with sceneItemId', async () => {
      const id = UUID.create();
      camera
        .flyTo((q) => q.withItemId(id))
        .render({
          animation: {
            milliseconds: 500,
          },
        });

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: {
            hex: id,
          },
          animation: {
            duration: { nanos: 500000000, seconds: 0 },
          },
        }),
        true
      );
    });

    it('should support fly to suppliedId with animations', async () => {
      camera
        .flyTo((q) => q.withSuppliedId('suppliedId'))
        .render({
          animation: {
            milliseconds: 500,
          },
        });

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          itemSuppliedId: 'suppliedId',
          animation: {
            duration: { nanos: 500000000, seconds: 0 },
          },
        }),
        true
      );
    });

    it('renders with fly to item id param', async () => {
      await camera.flyTo({ itemId: 'item-id' }).render();

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: {
            hex: 'item-id',
          },
        }),
        true
      );
    });

    it('renders with fly to bounding box param', async () => {
      const boundingBox = BoundingBox.create(
        Vector3.create(-1, -1, -1),
        Vector3.create(1, 1, 1)
      );
      await camera.flyTo({ boundingBox }).render();

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          boundingBox: {
            xmin: boundingBox.min.x,
            ymin: boundingBox.min.y,
            zmin: boundingBox.min.z,
            xmax: boundingBox.max.x,
            ymax: boundingBox.max.y,
            zmax: boundingBox.max.z,
          },
        }),
        true
      );
    });

    it('renders with fly to camera param', async () => {
      const data = FrameCamera.createOrthographic();
      await camera.flyTo({ camera: data }).render();

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: FrameCamera.toProtobuf(data),
        }),
        true
      );
    });

    it('should go to the visible bounding box on a viewAll', async () => {
      const newBoundingBox = BoundingBox.create(
        Vector3.create(1, 1, 1),
        Vector3.create(2, 2, 2)
      );
      const newCamera = new OrthographicCamera(
        stream,

        1,
        {
          ...data,
          viewVector: Vector3.forward(),
        },
        newBoundingBox,
        jest.fn()
      );

      await newCamera.viewAll().render();

      expect(stream.replaceCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({
            orthographic: expect.objectContaining({
              lookAt: Vector3.create(1.5, 1.5, 1.5),
              viewVector: Vector3.subtract(
                Vector3.create(1.5, 1.5, 1.5),
                Vector3.create(1.5, 1.5, 3.7998473026935273)
              ),
              up: Vector3.create(0, 1, 0),
            }),
          }),
        })
      );
    });

    it('viewAll should support animations', async () => {
      const newBoundingBox = BoundingBox.create(
        Vector3.create(1, 1, 1),
        Vector3.create(2, 2, 2)
      );
      const newCamera = new OrthographicCamera(
        stream,

        1,
        {
          ...data,
          viewVector: Vector3.forward(),
        },
        newBoundingBox,
        jest.fn()
      );

      await newCamera.viewAll().render({
        animation: {
          milliseconds: 500,
        },
      });

      expect(stream.flyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: {
            duration: { nanos: 500000000, seconds: 0 },
          },
          camera: expect.objectContaining({
            orthographic: expect.objectContaining({
              lookAt: Vector3.create(1.5, 1.5, 1.5),
              viewVector: Vector3.subtract(
                Vector3.create(1.5, 1.5, 1.5),
                Vector3.create(1.5, 1.5, 3.7998473026935273)
              ),
              up: Vector3.create(0, 1, 0),
            }),
          }),
        }),
        true
      );
    });

    it('should compute near and far clipping planes correctly', () => {
      const newBoundingBox = BoundingBox.create(
        Vector3.create(-1, -1, -1),
        Vector3.create(1, 1, 1)
      );
      const boundingBoxCenter = BoundingBox.center(newBoundingBox);
      const centerToBoundingPlane = Vector3.subtract(
        newBoundingBox.max,
        boundingBoxCenter
      );
      const radius = 1.1 * Vector3.magnitude(centerToBoundingPlane);

      const newCamera = new OrthographicCamera(
        stream,

        1,
        {
          ...data,
          viewVector: Vector3.create(0, 0, 1),
          lookAt: Vector3.origin(),
        },
        newBoundingBox,
        jest.fn()
      );

      expect(newCamera.far).toBe(1 + radius);
      expect(newCamera.near).toBe((1 + radius) * 0.01);
    });
  });
});
