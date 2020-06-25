import * as Camera from '../camera';
import { BoundingBox, Vector3, Angle } from '@vertexvis/geometry';

describe(Camera.fitToBoundingBox, () => {
  describe('with camera aspect < 1', () => {
    it('updates the camera with near and far values scaled relative to the smaller aspect ratio', () => {
      const camera = Camera.create({ aspect: 0.5 });

      const updatedCamera = Camera.fitToBoundingBox(
        BoundingBox.create(Vector3.up(), Vector3.down()),
        camera
      );
      expect(updatedCamera.near).toBeCloseTo(0.05);
      expect(updatedCamera.far).toBeCloseTo(6.52);
    });
  });
});

describe(Camera.rotateAroundAxis, () => {
  it('returns camera with position rotated around axis', () => {
    const camera = Camera.create({ position: Vector3.back() });
    const degrees = Angle.toRadians(90);
    const axis = Vector3.up();

    const result = Camera.rotateAroundAxis(degrees, axis, camera);
    expect(result.position.x).toBeCloseTo(1, 5);
    expect(result.position.y).toBeCloseTo(0, 5);
    expect(result.position.z).toBeCloseTo(0, 5);
  });
});

describe(Camera.offset, () => {
  it('shifts the position and lookat by the given delta', () => {
    const delta = Vector3.right();
    const camera = Camera.create({ position: Vector3.origin() });
    const result = Camera.offset(delta, camera);
    expect(result).toMatchObject({
      position: Vector3.right(),
      lookat: Vector3.right(),
    });
  });
});

describe(Camera.viewVector, () => {
  it('returns the vector between the position and lookat', () => {
    const camera = Camera.create({ position: Vector3.forward() });
    const viewVector = Camera.viewVector(camera);
    expect(viewVector).toEqual(Vector3.back());
  });
});
