import { Vector3 } from '@vertexvis/geometry';

export interface ViewerMeasurementDetailsSummary {
  parallelDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  area?: number;
  angle?: number;
  distanceVector?: Vector3.Vector3;
}
