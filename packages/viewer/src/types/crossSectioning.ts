import { Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';

export interface SectionPlane {
  normal: Vector3.Vector3;
  offset: number;
}

export interface CrossSectioning {
  sectionPlanes: Array<SectionPlane>;
  highlightColor?: Color.Color;
}

export function create(data: Partial<CrossSectioning> = {}): CrossSectioning {
  return {
    sectionPlanes: data.sectionPlanes || [],
    highlightColor: data.highlightColor,
  };
}
