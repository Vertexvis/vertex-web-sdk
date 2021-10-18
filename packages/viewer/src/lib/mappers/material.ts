import { Color, Mapper as M } from '@vertexvis/utils';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

export const mapRGBi: M.Func<vertexvis.protobuf.core.IRGBi, Color.Color> =
  M.defineMapper(
    M.read(M.requiredProp('r'), M.requiredProp('g'), M.requiredProp('b')),
    ([r, g, b]) => Color.create(r, g, b)
  );
