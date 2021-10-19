import { Plane, Vector3 } from '@vertexvis/geometry';
import { MeasureEntity } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

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
 * A type representing the possible measurement results.
 */
export type MeasurementResult =
  | MinimumDistanceMeasurementResult
  | PlanarAngleMeasurementResult
  | PlanarDistanceMeasurementResult;

/**
 * An outcome containing the results of the measurement.
 */
export interface MeasurementOutcome {
  results: MeasurementResult[];
}

/**
 * A model representing the state of measurement.
 *
 * Measurement contains a set of `MeasureEntity`s that represent what's being
 * measured, and a set of `MeasurementResult`s representing the results of the
 * measurement.
 *
 * Views can register event listeners to the model to be notified when new
 * measurements have been added.
 */
export class MeasurementModel {
  private entities = new Set<MeasureEntity>();
  private results = new Set<MeasurementResult>();
  private resultsChanged = new EventDispatcher<MeasurementResult[]>();

  /**
   * Registers an entity to be measured with the model.
   *
   * @param entity An entity to measure.
   * @returns `true` if the entity has been added.
   */
  public addEntity(entity: MeasureEntity): boolean {
    if (!this.entities.has(entity)) {
      this.entities.add(entity);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Adds a measurement result to the model.
   *
   * Emits a _result changed_ event.
   *
   * @param result A result to add.
   * @returns `true` if the result has been added.
   */
  public addResult(result: MeasurementResult): boolean {
    if (!this.results.has(result)) {
      this.results.add(result);
      this.resultsChanged.emit(this.getResults());
      return true;
    } else {
      return false;
    }
  }

  /**
   * Clears all registered entities from the model.
   */
  public clearEntities(): void {
    this.entities.forEach((e) => this.removeEntity(e));
  }

  /**
   * Clears all the measurement results from the model.
   *
   * Emits a _result changed_ event.
   */
  public clearResults(): void {
    this.results.forEach((r) => this.removeResult(r));
  }

  /**
   * Replaces all the results in the model with the results from an outcome.
   *
   * Emits a _result changed_ event.
   *
   * @param outcome The outcome that contains the new results.
   */
  public replaceResultsWithOutcome(outcome: MeasurementOutcome): void {
    this.clearResults();
    outcome.results.forEach((r) => this.addResult(r));
  }

  /**
   * Returns all the entities registered with the model.
   */
  public getEntities(): MeasureEntity[] {
    return Array.from(this.entities);
  }

  /**
   * Returns all the measurement results of the model.
   */
  public getResults(): MeasurementResult[] {
    return Array.from(this.results);
  }

  /**
   * Unregisters an entity from the model.
   *
   * @param entity The entity to remove.
   * @returns `true` if the entity was removed.
   */
  public removeEntity(entity: MeasureEntity): boolean {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Removes a measurement result from the model.
   *
   * Emits a _result changed_ event.
   *
   * @param result The result to remove.
   */
  public removeResult(result: MeasurementResult): boolean {
    if (this.results.has(result)) {
      this.results.delete(result);
      this.resultsChanged.emit(this.getResults());
      return true;
    } else {
      return false;
    }
  }

  /**
   * Registers an event listener that will be invoked when the model's
   * measurement results change.
   *
   * @param listener The listener to add.
   * @returns A disposable that can be used to remove the listener.
   */
  public onResultsChanged(listener: Listener<MeasurementResult[]>): Disposable {
    return this.resultsChanged.on(listener);
  }
}
