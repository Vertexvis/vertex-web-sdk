import type { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Mapper as M } from '@vertexvis/utils';

export const fromPbUuid: M.Func<vertexvis.protobuf.core.IUuid, string> =
  M.defineMapper(M.read(M.requiredProp('hex')), ([uuid]) => uuid);
