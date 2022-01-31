import { Plane, Vector3 } from '@vertexvis/geometry';

/**
 * A measurement result that represents the closets point between two entities.
 */
export interface MinimumDistanceMeasurementResult {
  /**
   * The type.
   */
  type: 'minimum-distance';

  /**
   * The distance between two points.
   */
  distance: number;

  /**
   * The closest point of the first entity, in world coordinates.
   */
  point1: Vector3.Vector3;

  /**
   * The closest point of the second entity, in world coordinates.
   */
  point2: Vector3.Vector3;
}

/**
 * A measurement result that represents the angle between two planar surfaces.
 */
export interface PlanarAngleMeasurementResult {
  /**
   * The type.
   */
  type: 'planar-angle';

  /**
   * The angle between two planes, in radians.
   */
  angle: number;

  /**
   * The plane of the first entity.
   */
  plane1: Plane.Plane;

  /**
   * The plane of the second entity.
   */
  plane2: Plane.Plane;
}

/**
 * A measurement result that represents the distance between two planar
 * surfaces.
 */
export interface PlanarDistanceMeasurementResult {
  /**
   * The type.
   */
  type: 'planar-distance';

  /**
   * The distance between the two planes.
   */
  distance: number;

  /**
   * The plane of the first entity.
   */
  plane1: Plane.Plane;

  /**
   * The plane of the second entity.
   */
  plane2: Plane.Plane;
}

/**
 * A measurement result that represents the surface area of one or more faces.
 */
export interface SurfaceAreaMeasurementResult {
  /**
   * The type.
   */
  type: 'surface-area';

  /**
   * The total area of selected face or faces.
   */
  area: number;
}

/**
 * A type representing the possible measurement results.
 */
export type MeasurementResult =
  | MinimumDistanceMeasurementResult
  | PlanarAngleMeasurementResult
  | PlanarDistanceMeasurementResult
  | SurfaceAreaMeasurementResult;

/**
 * Constructs a new measurement result from the given points.
 *
 * @param point1 A starting point.
 * @param point2 An ending point.
 * @returns A new measurement result.
 */
export function makeMinimumDistanceResult(
  point1: Vector3.Vector3,
  point2: Vector3.Vector3
): MinimumDistanceMeasurementResult {
  return {
    type: 'minimum-distance',
    point1,
    point2,
    distance: Vector3.distance(point1, point2),
  };
}
