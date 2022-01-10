import { Angle, Vector3 } from '@vertexvis/geometry';

import {
  makeLookAtMatrix,
  makeLookAtViewMatrix,
  makePerspectiveMatrix,
} from '../matrices';

describe(makePerspectiveMatrix, () => {
  const near = 1;
  const far = 2;
  const fovY = 90;
  const aspect = 1;

  it('should return the correct projection matrix', () => {
    const matrix = makePerspectiveMatrix(near, far, fovY, aspect);

    expect(matrix[0]).toBeCloseTo(1);
    expect(matrix[5]).toBeCloseTo(1);
    expect(matrix[10]).toBe(-3);
    expect(matrix[11]).toBe(-4);
    expect(matrix[14]).toBe(-1);
  });
});

describe(makeLookAtViewMatrix, () => {
  const camera = {
    position: Vector3.create(0, 1, 1),
    lookAt: Vector3.create(0, 0, 0),
    up: Vector3.create(0, 1, 0),
  };

  it('should return the correct view matrix', () => {
    const cosRotation = Math.cos(Angle.toRadians(45));
    const sinRotation = Math.sin(Angle.toRadians(45));
    const matrix = makeLookAtViewMatrix(camera);

    expect(matrix[0]).toBe(1);
    expect(matrix[5]).toBeCloseTo(cosRotation);
    expect(matrix[6]).toBeCloseTo(-sinRotation);
    expect(matrix[9]).toBeCloseTo(sinRotation);
    expect(matrix[10]).toBeCloseTo(cosRotation);
    expect(matrix[11]).toBeCloseTo(-1 * cosRotation + -1 * sinRotation);
    expect(matrix[15]).toBe(1);
  });
});

describe(makeLookAtMatrix, () => {
  const camera = {
    position: Vector3.create(0, 1, 1),
    lookAt: Vector3.create(0, 0, 0),
    up: Vector3.create(0, 1, 0),
  };

  it('should return the correct view matrix', () => {
    const cosRotation = Math.cos(Angle.toRadians(45));
    const sinRotation = Math.sin(Angle.toRadians(45));
    const matrix = makeLookAtMatrix(camera);

    expect(matrix[0]).toBe(1);
    expect(matrix[5]).toBeCloseTo(cosRotation);
    expect(matrix[9]).toBeCloseTo(-sinRotation);
    expect(matrix[6]).toBeCloseTo(sinRotation);
    expect(matrix[10]).toBeCloseTo(cosRotation);
    expect(matrix[11]).toBeCloseTo(camera.position.z);
    expect(matrix[15]).toBe(1);
  });
});
