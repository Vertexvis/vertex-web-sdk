import { UUID } from '@vertexvis/utils';
import { Vector3 } from '@vertexvis/geometry';

export interface SectionPlane {
  transientId: UUID.UUID;
  normal: Vector3.Vector3;
  offset: number;
}
