import { BoundingBox, Vector3 } from '@vertexvis/geometry';

import { FrameCamera } from '..';

describe(FrameCamera.toOrthographic, () => {
  it('converts perspective to orthographic', () => {
    const bounds = BoundingBox.create(
      Vector3.origin(),
      Vector3.create(1, 1, 1)
    );
    const perspective = FrameCamera.createPerspective();
    const orthographic = FrameCamera.toOrthographic(perspective, bounds);
    expect(FrameCamera.toOrthographic(perspective, bounds)).toMatchObject(
      orthographic
    );
  });
});

describe(FrameCamera.toPerspective, () => {
  it('converts orthographic to perspective', () => {
    const orthographic = FrameCamera.createOrthographic();
    const perspective = FrameCamera.toPerspective(orthographic);
    expect(FrameCamera.toPerspective(orthographic)).toMatchObject(perspective);
  });
});

describe(FrameCamera.isValidFrameCamera, () => {
  it('returns true for a valid perspective camera', () => {
    const perspective = FrameCamera.createPerspective();
    expect(FrameCamera.isValidFrameCamera(perspective)).toEqual(true);
  });

  it('returns false for an invalid perspective camera', () => {
    const invalidPositionVector = Vector3.create(100, 50, Infinity);

    const perspective = FrameCamera.createPerspective({
      position: invalidPositionVector,
    });
    expect(FrameCamera.isValidFrameCamera(perspective)).toEqual(false);
  });

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
});
