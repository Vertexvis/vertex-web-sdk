import { Vector3 } from '@vertexvis/geometry';
import { MeasurementResult } from '../../lib/measurement/model';

export interface MeasurementDetailsSummary {
  parallelDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  area?: number;
  angle?: number;
  x?: number;
  y?: number;
  z?: number;
}

export function getMeasurementDetailsSummary(
  results: MeasurementResult[]
): MeasurementDetailsSummary {
  return results.reduce((d, result) => {
    const distanceVector =
      result.type === 'minimum-distance'
        ? Vector3.subtract(result.closestPoint1, result.closestPoint2)
        : undefined;

    return {
      ...d,
      minDistance:
        result.type === 'minimum-distance' ? result.distance : d.minDistance,
      angle: result.type === 'planar-angle' ? result.angle : d.angle,
      parallelDistance:
        result.type === 'planar-distance'
          ? result.distance
          : d.parallelDistance,
      x: distanceVector != null ? distanceVector.x : d.x,
      y: distanceVector != null ? distanceVector.y : d.y,
      z: distanceVector != null ? distanceVector.z : d.z,
    };
  }, {} as MeasurementDetailsSummary);
}
