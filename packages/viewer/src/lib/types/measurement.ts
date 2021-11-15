import { Vector3 } from '@vertexvis/geometry';
import { UUID } from '@vertexvis/utils';
import { DistanceUnits } from './measurementUnits';

export interface DistanceMeasurementInit {
  start?: Vector3.Vector3;
  end?: Vector3.Vector3;
  invalid?: boolean;
  id?: string;
}

export class DistanceMeasurement {
  public readonly start: Vector3.Vector3;
  public readonly end: Vector3.Vector3;
  public readonly invalid: boolean;
  public readonly id: string;

  public constructor(init: DistanceMeasurementInit) {
    this.start = init.start ?? Vector3.origin();
    this.end = init.end ?? Vector3.origin();
    this.invalid = init.invalid ?? false;
    this.id = init.id ?? `measurement--${UUID.create()}`;
  }

  public getWorldDistance(): number {
    return Vector3.distance(this.start, this.end);
  }

  public getRealDistance(units: DistanceUnits): number {
    return units.convertRealValueToWorld(this.getWorldDistance());
  }
}

export type Measurement = DistanceMeasurement;
