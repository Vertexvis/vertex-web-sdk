import { Plane, Vector3 } from '@vertexvis/geometry';
import { ModelEntity } from '@vertexvis/scene-view-protos/core/protos/model_entity_pb';
import { MeasureEntity } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import {
  Disposable,
  EventDispatcher,
  Listener,
  Mapper,
} from '@vertexvis/utils';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { fromPbVector3f } from '../mappers';
import { Vector3f } from '@vertexvis/scene-view-protos/core/protos/geometry_pb';

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
  | PlanarDistanceMeasurementResult;

/**
 * An outcome containing the results of the measurement.
 */
export interface MeasurementOutcome {
  results: MeasurementResult[];
}

export class MeasurementEntity {
  public constructor(
    public readonly point: Vector3.Vector3,
    public readonly modelEntity: Uint8Array
  ) {}

  public static fromHit(
    hit: vertexvis.protobuf.stream.IHit
  ): MeasurementEntity {
    if (hit.hitPoint != null && hit.modelEntity != null) {
      const hitPoint = Mapper.ifInvalidThrow(fromPbVector3f)(hit.hitPoint);
      const modelEntity = vertexvis.protobuf.core.ModelEntity.encode(
        hit.modelEntity
      ).finish();
      return new MeasurementEntity(hitPoint, modelEntity);
    } else {
      throw new Error(
        'Cannot create MeasurementEntity from Hit. Hit is missing hit point and model entity'
      );
    }
  }

  public toProto(): MeasureEntity {
    const entity = new MeasureEntity();

    const point = new Vector3f();
    point.setX(this.point.x);
    point.setY(this.point.y);
    point.setZ(this.point.z);
    entity.setPoint(point);

    const modelEntity = ModelEntity.deserializeBinary(this.modelEntity);
    entity.setModelEntity(modelEntity);

    return entity;
  }
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
  private entities = new Set<MeasurementEntity>();
  private results = new Set<MeasurementResult>();
  private resultsChanged = new EventDispatcher<MeasurementResult[]>();
  private entitiesChanged = new EventDispatcher<MeasurementEntity[]>();

  /**
   * Registers an entity to be measured with the model.
   *
   * @param entity An entity to measure.
   * @returns `true` if the entity has been added.
   */
  public addEntity(entity: MeasurementEntity): boolean {
    if (!this.entities.has(entity)) {
      this.entities.add(entity);
      this.entitiesChanged.emit(this.getEntities());
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
  public getEntities(): MeasurementEntity[] {
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
  public removeEntity(entity: MeasurementEntity): boolean {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.entitiesChanged.emit(this.getEntities());
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

  /**
   * Registers an event listener that will be invoked when the model's
   * measurement entities change.
   *
   * @param listener The listener to add.
   * @returns A disposable that can be used to remove the listener.
   */
  public onEntitiesChanged(
    listener: Listener<MeasurementEntity[]>
  ): Disposable {
    return this.entitiesChanged.on(listener);
  }
}
