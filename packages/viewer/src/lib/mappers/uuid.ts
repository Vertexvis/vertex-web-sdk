import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import { UUID } from '@vertexvis/utils';

export function toUuid2l(id: UUID.UUID): Uuid2l {
  const msbLsb = UUID.toMsbLsb(id);
  const pb = new Uuid2l();
  pb.setMsb(msbLsb.msb);
  pb.setLsb(msbLsb.lsb);
  return pb;
}
