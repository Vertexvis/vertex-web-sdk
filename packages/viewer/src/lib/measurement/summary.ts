import { Vector3 } from '@vertexvis/geometry';
import {
  MeasurementResult,
  MinimumDistanceMeasurementResult,
  PlanarAngleMeasurementResult,
  PlanarDistanceMeasurementResult,
} from './model';

export interface MeasurementDetailsSummary {
  parallelDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  area?: number;
  angle?: number;
  distanceVector?: Vector3.Vector3;
}

export function summarizeResults(
  results: MeasurementResult[]
): MeasurementDetailsSummary {
  return results.reduce((summary, result) => {
    switch (result.type) {
      case 'minimum-distance':
        return { ...summary, ...summarizeMinDistanceResult(result) };
      case 'planar-angle':
        return { ...summary, ...summarizeFromPlanarAngleResult(result) };
      case 'planar-distance':
        return { ...summary, ...summarizePlanarDistanceResult(result) };
    }
  }, {});
}

function summarizeMinDistanceResult(
  result: MinimumDistanceMeasurementResult
): MeasurementDetailsSummary {
  const distanceVector = Vector3.subtract(
    result.closestPoint1,
    result.closestPoint2
  );

  return {
    minDistance: result.distance,
    distanceVector,
  };
}

function summarizePlanarDistanceResult(
  result: PlanarDistanceMeasurementResult
): MeasurementDetailsSummary {
  return {
    parallelDistance: result.distance,
  };
}

function summarizeFromPlanarAngleResult(
  result: PlanarAngleMeasurementResult
): MeasurementDetailsSummary {
  return {
    angle: result.angle,
  };
}
