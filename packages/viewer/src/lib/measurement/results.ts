import type { Plane, Vector3 } from '@vertexvis/geometry';

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
  closestPoint1: Vector3.Vector3;

  /**
   * The closest point of the second entity, in world coordinates.
   */
  closestPoint2: Vector3.Vector3;
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
 * A measurement result that represents the distance between two points.
 */
export interface PointToPointMeasurementResult {
  /**
   * The type.
   */
  type: 'point-to-point';

  /**
   * The distance, in world units, between two points. This value is only
   * populated if the result is valid.
   */
  distance?: number;

  /**
   * The first point, in world units.
   */
  start: Vector3.Vector3;

  /**
   * The second point, in world units.
   */
  end: Vector3.Vector3;

  /**
   * Indicates if this result is valid. A value of `false` indicates that one of
   * the points does not touch any geometry.
   */
  valid: boolean;
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
  | SurfaceAreaMeasurementResult
  | PointToPointMeasurementResult;
