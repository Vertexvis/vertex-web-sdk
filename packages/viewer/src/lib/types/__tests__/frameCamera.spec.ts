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
