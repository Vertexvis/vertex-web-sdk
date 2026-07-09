import { BoundingBox, Vector3 } from '@vertexvis/geometry';

import { FrameCamera } from '..';

describe('FrameCamera.toOrthographic', () => {
  it('converts perspective to orthographic', () => {
    const bounds = BoundingBox.create(
      Vector3.origin(),
      Vector3.create(1, 1, 1),
    );
    const perspective = FrameCamera.createPerspective();
    const orthographic = FrameCamera.toOrthographic(perspective, bounds);
    expect(FrameCamera.toOrthographic(perspective, bounds)).toMatchObject(
      orthographic,
    );
  });
});

describe('FrameCamera.toPerspective', () => {
  it('converts orthographic to perspective', () => {
    const orthographic = FrameCamera.createOrthographic();
    const perspective = FrameCamera.toPerspective(orthographic);
    expect(FrameCamera.toPerspective(orthographic)).toMatchObject(perspective);
  });
});

describe('FrameCamera.isValidFrameCamera Perspective', () => {
  let validPerspective: FrameCamera.PerspectiveFrameCamera;
  beforeEach(() => {
    validPerspective = FrameCamera.createPerspective();
  });

  it('returns true for a valid perspective camera', () => {
    expect(FrameCamera.isValidFrameCamera(validPerspective)).toEqual(true);
  });

  it('returns false for an invalid perspective camera', () => {
    const invalidPositionVector = Vector3.create(100, 50, Infinity);

    expect(
      FrameCamera.isValidFrameCamera({
        ...validPerspective,
        position: invalidPositionVector,
      }),
    ).toEqual(false);
  });

  it('returns false for a perspective camera with a zero up vector', () => {
    expect(
      FrameCamera.isValidFrameCamera({
        ...validPerspective,
        up: Vector3.origin(),
      }),
    ).toEqual(false);
  });

  it('returns true for a perspective camera with an axis-aligned up vector', () => {
    expect(
      FrameCamera.isValidFrameCamera({
        ...validPerspective,
        up: Vector3.up(),
      }),
    ).toEqual(true);
  });

  it('returns true for a perspective camera with fovY boundaries', () => {
    expect(
      FrameCamera.isValidFrameCamera({
        ...validPerspective,
        fovY: 1,
      }),
    ).toEqual(true);
    expect(
      FrameCamera.isValidFrameCamera({
        ...validPerspective,
        fovY: 179,
      }),
    ).toEqual(true);
  });

  it('returns false for a perspective camera with missing fovY', () => {
    expect(
      FrameCamera.isValidFrameCamera({ ...validPerspective, fovY: undefined }),
    ).toEqual(false);
  });

  it('returns false for a perspective camera with out-of-range fovY', () => {
    expect(
      FrameCamera.isValidFrameCamera({
        ...validPerspective,
        fovY: 0,
      }),
    ).toEqual(false);
    expect(
      FrameCamera.isValidFrameCamera({
        ...validPerspective,
        fovY: 180,
      }),
    ).toEqual(false);
  });

  it('returns false for a perspective camera with non-finite fovY', () => {
    expect(
      FrameCamera.isValidFrameCamera({ ...validPerspective, fovY: Infinity }),
    ).toEqual(false);
  });

  it('returns false for a perspective camera with a zero view vector', () => {
    expect(
      FrameCamera.isValidFrameCamera({
        ...validPerspective,
        position: Vector3.origin(),
        lookAt: Vector3.origin(),
      }),
    ).toEqual(false);
  });

});

describe('FrameCamera.isValidFrameCamera Orthographic', () => {
  it('returns true for a valid orthographic camera', () => {
    const orthographic = FrameCamera.createOrthographic();
    expect(FrameCamera.isValidFrameCamera(orthographic)).toEqual(true);
  });

  it('returns false for an invalid orthographic camera', () => {
    const invalidViewVector = Vector3.create(100, 50, Infinity);

    const perspective = FrameCamera.createOrthographic({
      viewVector: invalidViewVector,
    });
    expect(FrameCamera.isValidFrameCamera(perspective)).toEqual(false);
  });

  it('returns false for an orthographic camera with a zero view vector', () => {
    const orthographic = FrameCamera.createOrthographic({
      viewVector: Vector3.origin(),
    });

    expect(FrameCamera.isValidFrameCamera(orthographic)).toEqual(false);
  });

  it('returns false for an orthographic camera with a zero up vector', () => {
    const orthographic = FrameCamera.createOrthographic({
      up: Vector3.origin(),
    });

    expect(FrameCamera.isValidFrameCamera(orthographic)).toEqual(false);
  });

  it('returns true for an orthographic camera with axis-aligned view and up vectors', () => {
    const orthographic = FrameCamera.createOrthographic({
      viewVector: Vector3.back(),
      up: Vector3.up(),
    });

    expect(FrameCamera.isValidFrameCamera(orthographic)).toEqual(true);
  });

  it('returns false for an orthographic camera with zero fov height', () => {
    const orthographic = FrameCamera.createOrthographic({
      fovHeight: 0,
    });

    expect(FrameCamera.isValidFrameCamera(orthographic)).toEqual(false);
  });

  it('returns false for an orthographic camera with negative fov height', () => {
    const orthographic = FrameCamera.createOrthographic({
      fovHeight: -1,
    });

    expect(FrameCamera.isValidFrameCamera(orthographic)).toEqual(false);
  });

  it('returns false for an orthographic camera with non-finite fov height', () => {
    const orthographic = FrameCamera.createOrthographic({
      fovHeight: Infinity,
    });

    expect(FrameCamera.isValidFrameCamera(orthographic)).toEqual(false);
  });

  it('returns false for an empty orthographic model view camera', () => {
    const orthographic = FrameCamera.createOrthographic({
      fovHeight: 0,
      lookAt: Vector3.origin(),
      up: Vector3.origin(),
      viewVector: Vector3.origin(),
    });

    expect(FrameCamera.isValidFrameCamera(orthographic)).toEqual(false);
  });

  it('returns false for a partial camera with missing vector fields', () => {
    expect(
      FrameCamera.isValidFrameCamera({
        position: Vector3.create(1, 2, 3),
      }),
    ).toEqual(false);
  });
});
