import { Vector3 } from '@vertexvis/geometry';

export interface SectionPlane {
  normal: Vector3.Vector3;
  offset: number;
}

export interface CrossSectioning {
  sectionPlanes: Array<SectionPlane>;
}

export function create(data: Partial<CrossSectioning> = {}): CrossSectioning {
  return {
    sectionPlanes: data.sectionPlanes || [],
  };
}
