import type { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import { protoToDate } from '@vertexvis/stream-api';
import { Mapper as M, UUID } from '@vertexvis/utils';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

export const fromPbUuid2l: M.Func<Uuid2l.AsObject, UUID.UUID> = M.defineMapper(
  M.read(M.requiredProp('msb'), M.requiredProp('lsb')),
  ([msb, lsb]) => UUID.fromMsbLsb(msb, lsb)
);

export const fromPbTimestamp: M.Func<Timestamp.AsObject, Date> = M.defineMapper(
  M.read(M.requiredProp('seconds'), M.requiredProp('nanos')),
  ([seconds, nanos]) => protoToDate({ seconds, nanos })
);
