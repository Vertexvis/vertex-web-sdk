import { Angle, Vector3 } from '@vertexvis/geometry';

import { FrameCamera } from '..';

const perspective = FrameCamera.createPerspective();
const orthographic = FrameCamera.toOrthographic(perspective);

describe(FrameCamera.toOrthographic, () => {
  it('converts perspective to orthographic', () => {
    expect(FrameCamera.toOrthographic(perspective)).toMatchObject(orthographic);
  });
});

describe(FrameCamera.toPerspective, () => {
  it('converts orthographic to perspective', () => {
    expect(FrameCamera.toPerspective(orthographic)).toMatchObject(perspective);
  });
});
