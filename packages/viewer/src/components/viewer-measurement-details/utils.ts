import { Vector3 } from '@vertexvis/geometry';
import {
  MeasurementResult,
  MinimumDistanceMeasurementResult,
  PlanarDistanceMeasurementResult,
  PlanarAngleMeasurementResult,
} from '../../lib/measurement/model';
import { ViewerMeasurementDetailsSummary } from './interfaces';

export type MeasurementResultSummaryFormatter<T extends MeasurementResult> = (
  result: T,
  summary?: ViewerMeasurementDetailsSummary
) => ViewerMeasurementDetailsSummary;

export function summaryFromMinDistanceResult(
  result: MinimumDistanceMeasurementResult,
  summary: ViewerMeasurementDetailsSummary = {}
): ViewerMeasurementDetailsSummary {
  const distanceVector = Vector3.subtract(
    result.closestPoint1,
    result.closestPoint2
  );

  return {
    ...summary,
    minDistance: result.distance,
    distanceVector,
  };
}

export function summaryFromPlanarDistanceResult(
  result: PlanarDistanceMeasurementResult,
  summary: ViewerMeasurementDetailsSummary = {}
): ViewerMeasurementDetailsSummary {
  return {
    ...summary,
    parallelDistance: result.distance,
  };
}

export function summaryFromPlanarAngleResult(
  result: PlanarAngleMeasurementResult,
  summary: ViewerMeasurementDetailsSummary = {}
): ViewerMeasurementDetailsSummary {
  return {
    ...summary,
    angle: result.angle,
  };
}

export function formatResults(
  results: MeasurementResult[]
): ViewerMeasurementDetailsSummary {
  return results.reduce((summary, result) => {
    switch (result.type) {
      case 'minimum-distance':
        return summaryFromMinDistanceResult(result, summary);
      case 'planar-angle':
        return summaryFromPlanarAngleResult(result, summary);
      case 'planar-distance':
        return summaryFromPlanarDistanceResult(result, summary);
    }
  }, {});
}
