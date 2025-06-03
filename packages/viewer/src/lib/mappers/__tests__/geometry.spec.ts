import { vertexvis } from '@vertexvis/frame-streaming-protos';

import { fromPbMatrix4f, fromPbVector4f } from '../geometry';

describe(fromPbVector4f, () => {
  it('returns mapped vector4', () => {
    const pbVector4 = new vertexvis.protobuf.core.Vector4f({
      x: 10,
      y: 20,
      z: 30,
      w: 40,
    });

    const actual = fromPbVector4f(pbVector4);

    expect(actual).toMatchObject({
      x: 10,
      y: 20,
      z: 30,
      w: 40,
    });
  });
});

describe(fromPbMatrix4f, () => {
  it('returns mapped Matrix4x4', () => {
    const pbMatrix4x4 = new vertexvis.protobuf.core.Matrix4x4f({
      r0: { x: 10, y: 20, z: 30, w: 40 },
      r1: { x: 50, y: 60, z: 70, w: 80 },
      r2: { x: 90, y: 100, z: 110, w: 120 },
      r3: { x: 130, y: 140, z: 150, w: 160 },
    });

    const actual = fromPbMatrix4f(pbMatrix4x4);

    expect(actual).toMatchObject([
      10, 50, 90, 130, 20, 60, 100, 140, 30, 70, 110, 150, 40, 80, 120, 160,
    ]);
  });
});
