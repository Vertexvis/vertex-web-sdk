import { Color, Mapper as M } from '@vertexvis/utils';
import type { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Color3 } from '../../interfaces';

export const fromPbRGBi: M.Func<vertexvis.protobuf.core.IRGBi, Color.Color> =
  M.defineMapper(
    M.read(M.requiredProp('r'), M.requiredProp('g'), M.requiredProp('b')),
    ([r, g, b]) => Color.create(r, g, b)
  );

export const toPbRGBi: M.Func<Color3, vertexvis.protobuf.core.IRGBi> =
  M.defineMapper(
    (color) => {
      function createRGBi(color: Color.Color): vertexvis.protobuf.core.IRGBi {
        return { r: color.r, g: color.g, b: color.b };
      }

      if (typeof color === 'string') {
        const c = Color.fromHexString(color);
        return c != null
          ? createRGBi(c)
          : { errors: ['String is not a valid color.'] };
      } else if (typeof color === 'number') {
        return createRGBi(Color.fromNumber(color));
      } else {
        return createRGBi(color);
      }
    },
    (color) => color
  );
