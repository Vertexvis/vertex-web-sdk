import { MeasurementResult, PointToPointMeasurementResult } from './results';

/**
 * An outcome containing the results of a precise measurement.
 */
export interface PreciseMeasurementOutcome {
  type: 'precise';
  results: MeasurementResult[];
}

/**
 * An outcome containing the results of an imprecise measurement.
 */
export interface ImpreciseMeasurementOutcome {
  type: 'imprecise';
  result: PointToPointMeasurementResult;
}

/**
 * An outcome containing the results of a measurement.
 */
export type MeasurementOutcome =
  | ImpreciseMeasurementOutcome
  | PreciseMeasurementOutcome;
