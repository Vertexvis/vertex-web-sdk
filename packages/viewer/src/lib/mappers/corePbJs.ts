import type { vertexvis } from '@vertexvis/frame-streaming-protos';
import { UUID } from '@vertexvis/utils';
import { Mapper as M } from '@vertexvis/utils';
import Long from 'long';

export const fromPbJsUuid: M.Func<vertexvis.protobuf.core.IUuid, UUID.UUID> =
  M.defineMapper(M.read(M.requiredProp('hex')), ([uuid]) => uuid);

export const fromPbJsUuid2l: M.Func<
  vertexvis.protobuf.core.IUuid2l,
  UUID.UUID
> = M.defineMapper(
  M.read(M.requiredProp('msb'), M.requiredProp('lsb')),
  ([msb, lsb]) => {
    const m = BigInt(typeof msb === 'number' ? msb : msb.toString());
    const l = BigInt(typeof lsb === 'number' ? lsb : lsb.toString());
    return UUID.fromMsbLsb(m, l);
  }
);

export const toPbJsUuid2l: M.Func<string, vertexvis.protobuf.core.IUuid2l> =
  M.defineMapper(
    M.compose(
      (str) => UUID.toMsbLsb(str),
      M.read(
        M.mapProp('msb', Long.fromString),
        M.mapProp('lsb', Long.fromString)
      )
    ),
    ([msb, lsb]) => ({ msb, lsb })
  );
