import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import { toMsbLsb, UUID } from '@vertexvis/utils/src/uuid';

export function toUuid2l(id: UUID): Uuid2l {
  const msbLsb = toMsbLsb(id);
  const pb = new Uuid2l();
  pb.setMsb(msbLsb.msb);
  pb.setLsb(msbLsb.lsb);
  return pb;
}
