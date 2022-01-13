import { Vector3 } from '@vertexvis/geometry';

import {
  MeasurementResult,
  MinimumDistanceMeasurementResult,
  PlanarAngleMeasurementResult,
  PlanarDistanceMeasurementResult,
  PointToPointMeasurementResult,
  SurfaceAreaMeasurementResult,
} from './results';

type Approximateable<T> = T & { isApproximated: boolean };

export interface MeasurementDetailsSummary {
  parallelDistance?: number;
  minDistance?: Approximateable<{ value: number }>;
  maxDistance?: number;
  area?: number;
  angle?: number;
  distanceVector?: Approximateable<Vector3.Vector3>;
}

export function summarizeResults(
  results: MeasurementResult[]
): MeasurementDetailsSummary {
  return results.reduce((summary, result) => {
    switch (result.type) {
      case 'point-to-point':
        return { ...summary, ...summarizePointToPointResult(result) };
      case 'minimum-distance':
        return { ...summary, ...summarizeMinDistanceResult(result) };
      case 'planar-angle':
        return { ...summary, ...summarizeFromPlanarAngleResult(result) };
      case 'planar-distance':
        return { ...summary, ...summarizePlanarDistanceResult(result) };
      case 'surface-area':
        return { ...summary, ...summarizeSurfaceAreaResult(result) };
    }
  }, {});
}

function summarizePointToPointResult(
  result: PointToPointMeasurementResult
): MeasurementDetailsSummary {
  const v = Vector3.subtract(result.start, result.end);
  const d = Vector3.distance(result.start, result.end);
  return {
    distanceVector: { ...v, isApproximated: true },
    minDistance: { value: d, isApproximated: true },
  };
}

function summarizeMinDistanceResult(
  result: MinimumDistanceMeasurementResult
): MeasurementDetailsSummary {
  const distanceVector = Vector3.subtract(
    result.closestPoint1,
    result.closestPoint2
  );

  return {
    distanceVector: { ...distanceVector, isApproximated: false },
    minDistance: { value: result.distance, isApproximated: false },
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

function summarizeSurfaceAreaResult(
  result: SurfaceAreaMeasurementResult
): MeasurementDetailsSummary {
  return {
    area: result.area,
  };
}
