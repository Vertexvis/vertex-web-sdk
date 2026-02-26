import { RGBAi } from '@vertexvis/scene-view-protos/core/protos/material_pb';
import { Color } from '@vertexvis/utils';

export function makeRGBAi(
  color: Color.Color | string = Color.create(255, 255, 255)
): RGBAi {
  const effectiveColor =
    typeof color === 'string' ? Color.fromHexString(color) : color;

  const c = new RGBAi();

  if (effectiveColor != null) {
    c.setR(effectiveColor.r);
    c.setG(effectiveColor.g);
    c.setB(effectiveColor.b);
    c.setA(effectiveColor.a);
  }

  return c;
}
