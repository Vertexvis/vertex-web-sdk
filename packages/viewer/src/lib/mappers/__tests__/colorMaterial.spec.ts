import { vertexvis } from '@vertexvis/frame-streaming-protos';

import { fromPbColorMaterial } from '../colorMaterial';

describe(fromPbColorMaterial, () => {
  it('returns mapped color material', () => {
    const pbColorMaterial = new vertexvis.protobuf.core.ColorMaterial({
      d: 10,
      ns: 20,
      ka: new vertexvis.protobuf.core.RGBi({ r: 255, g: 255, b: 255 }),
      kd: new vertexvis.protobuf.core.RGBi({ r: 100, g: 255, b: 100 }),
      ks: new vertexvis.protobuf.core.RGBi({ r: 255, g: 100, b: 255 }),
      ke: new vertexvis.protobuf.core.RGBi({ r: 0, g: 255, b: 0 }),
    });

    const actual = fromPbColorMaterial(pbColorMaterial);

    expect(actual).toMatchObject({
      ambient: { a: 255, b: 255, g: 255, r: 255 },
      diffuse: {
        a: 255,
        b: 100,
        g: 255,
        r: 100,
      },
      emissive: {
        a: 255,
        b: 0,
        g: 255,
        r: 0,
      },
      glossiness: 20,
      opacity: 10,
      specular: {
        a: 255,
        b: 255,
        g: 100,
        r: 255,
      },
    });
  });
});
