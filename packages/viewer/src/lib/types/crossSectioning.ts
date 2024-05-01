import { Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';

export interface SectionPlane {
  /**
   * A unit vector orthogonal to the plane that is used to
   * determine what geometry will remain visible. For example, a `normal` of
   * `{ x: 1, y: 0, z: 0 }` will cause anything in the negative x direction
   * (from the `offset`) to be occluded.
   */
  normal: Vector3.Vector3;

  /**
   * The distance from the origin along the `normal` vector
   * for this `SectionPlane`.
   */
  offset: number;
}

export interface CrossSectioning {
  sectionPlanes: Array<SectionPlane>;

  /**
   * The color to display the cross section lines with.
   */
  highlightColor?: Color.Color;

  /**
   * The width to display the cross section lines with. This value
   * corresponds to approximately half the width of the line in pixels.
   */
  lineWidth?: number;
}

export function create(data: Partial<CrossSectioning> = {}): CrossSectioning {
  return {
    sectionPlanes: data.sectionPlanes || [],
    highlightColor: data.highlightColor,
    lineWidth: data.lineWidth,
  };
}
