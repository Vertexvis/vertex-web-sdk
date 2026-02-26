import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Color, Mapper as M } from '@vertexvis/utils';

export const fromPbRGBAi: M.Func<vertexvis.protobuf.core.IRGBAi, Color.Color> =
  M.defineMapper(
    M.read(
      M.requiredProp('r'),
      M.requiredProp('g'),
      M.requiredProp('b'),
      M.requiredProp('a')
    ),
    ([r, g, b, a]) => Color.create(r, g, b, a)
  );
