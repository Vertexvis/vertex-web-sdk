import { FrameCamera } from '..';

describe(FrameCamera.toOrthographic, () => {
  it('converts perspective to orthographic', () => {
    const perspective = FrameCamera.createPerspective();
    const orthographic = FrameCamera.toOrthographic(perspective);
    expect(FrameCamera.toOrthographic(perspective)).toMatchObject(orthographic);
  });
});

describe(FrameCamera.toPerspective, () => {
  it('converts orthographic to perspective', () => {
    const orthographic = FrameCamera.createOrthographic();
    const perspective = FrameCamera.toPerspective(orthographic);
    expect(FrameCamera.toPerspective(orthographic)).toMatchObject(perspective);
  });
});
