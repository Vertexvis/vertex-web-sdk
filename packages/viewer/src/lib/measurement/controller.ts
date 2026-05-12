import { ModelEntity } from '@vertexvis/scene-view-protos/core/protos/model_entity_pb';
import {
  MeasureRequest,
  MeasureResponse,
  ModelEntityUpdate,
  UpdateModelEntitiesRequest,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { BoolValue } from 'google-protobuf/google/protobuf/wrappers_pb';

import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import { MeasurementEntity } from './entities';
import { mapMeasureResponseOrThrow } from './mapper';
import { MeasurementModel } from './model';
import { MeasurementOutcome } from './outcomes';

/**
 * The `MeasurementController` is responsible for performing measurements of
 * registered entities, and updating the model with their measurement results.
 */
export class MeasurementController {
  private outcome = Promise.resolve<MeasurementOutcome | undefined>(undefined);
  private debugLogs = false;

  public constructor(
    private model: MeasurementModel,
    private client: SceneViewAPIClient,
    private jwtProvider: JwtProvider,
    private deviceId: string | undefined
  ) {}

  /**
   * Registers an entity to measure and performs a measurement if this entity
   * has not been previously registered.
   *
   * @param entity The entity to measure.
   * @returns A promise that resolves with the results after registering this
   * entity.
   */
  public addEntity(
    entity: MeasurementEntity
  ): Promise<MeasurementOutcome | undefined> {
    if (this.debugLogs) {
      const deserializedEntity = ModelEntity.deserializeBinary(
        entity.modelEntity
      );

      this.log(
        `Adding ModelEntity. [entityId={${deserializedEntity.getEntityId()}}, sceneItemId={${deserializedEntity.getSceneItemId()}}]`
      );
    }

    return this.performMeasurement(() => this.model.addEntity(entity));
  }

  /**
   * Clears all entities and returns a promise that resolves with an empty list
   * of measurement results.
   */
  public clearEntities(): Promise<MeasurementOutcome | undefined> {
    this.log('Clearing all ModelEntities.');

    return this.performMeasurement(() => {
      this.model.clearEntities();
      this.model.clearOutcome();
      return true;
    });
  }

  /**
   * Deregisters an entity and performs a measurement if this entity was
   * removed.
   *
   * @param entity The entity to remove.
   * @returns A promise that resolves with the results after removing this
   * entity.
   */
  public removeEntity(
    entity: MeasurementEntity
  ): Promise<MeasurementOutcome | undefined> {
    if (this.debugLogs) {
      const deserializedEntity = ModelEntity.deserializeBinary(
        entity.modelEntity
      );

      this.log(
        `Removing ModelEntity. [entityId={${deserializedEntity.getEntityId()}}, sceneItemId={${deserializedEntity.getSceneItemId()}}]`
      );
    }

    return this.performMeasurement(() => this.model.removeEntity(entity));
  }

  /**
   * Registers a set of entities and performs a measurement
   *
   * @param entities The entities to measure.
   * @returns A promise that resolves with the results after registering these
   * entities.
   */
  public setEntities(
    entities: Set<MeasurementEntity>
  ): Promise<MeasurementOutcome | undefined> {
    if (this.debugLogs) {
      const deserializedEntities = Array.from(entities).map((e) =>
        ModelEntity.deserializeBinary(e.modelEntity)
      );

      this.log(
        `Setting ${deserializedEntities.length} ModelEntities. [entityIds=[${deserializedEntities.map((e) => e.getEntityId()).join(', ')}], sceneItemIds=[${deserializedEntities.map((e) => e.getSceneItemId()).join(', ')}]]`
      );
    }

    return this.performMeasurement(() => this.model.setEntities(entities));
  }

  public setDebugLogs(debugLogs: boolean): void {
    this.debugLogs = debugLogs;
  }

  private performMeasurement(
    effect: () => boolean
  ): Promise<MeasurementOutcome | undefined> {
    const previous = this.model.getEntities();
    const changed = effect();
    const entities = this.model.getEntities();
    if (changed) {
      this.measureAndUpdateModel(entities);
      this.highlightEntities(previous, entities);
    }
    return this.outcome;
  }

  private measureAndUpdateModel(entities: MeasurementEntity[]): void {
    if (entities.length > 0) {
      this.outcome = this.measureEntities(entities).then((outcome) => {
        this.model.setOutcome(outcome);
        return this.model.getOutcome();
      });
    } else {
      this.outcome = Promise.resolve(undefined);
    }
  }

  private async measureEntities(
    entities: MeasurementEntity[]
  ): Promise<MeasurementOutcome | undefined> {
    if (entities.length > 0) {
      const res = await requestUnary<MeasureResponse>(async (handler) => {
        const meta = await createMetadata(this.jwtProvider, this.deviceId);
        const req = new MeasureRequest();
        req.setEntitiesList(entities.map((e) => e.toProto()));

        this.client.measure(req, meta, handler);
      });

      return mapMeasureResponseOrThrow(res.toObject());
    } else {
      return undefined;
    }
  }

  private async highlightEntities(
    previous: MeasurementEntity[],
    entities: MeasurementEntity[]
  ): Promise<void> {
    await requestUnary(async (handler) => {
      const meta = await createMetadata(this.jwtProvider, this.deviceId);

      const entitySet = new Set(entities);
      const newPrevious = previous.filter((e) => !entitySet.has(e));

      const clearEntities = newPrevious.map((e) => {
        const update = new ModelEntityUpdate();
        update.setModelEntity(ModelEntity.deserializeBinary(e.modelEntity));
        update.setHighlight(new BoolValue().setValue(false));
        return update;
      });
      const highlightEntities = entities.map((e) => {
        const update = new ModelEntityUpdate();
        update.setModelEntity(ModelEntity.deserializeBinary(e.modelEntity));
        update.setHighlight(new BoolValue().setValue(true));
        return update;
      });

      const req = new UpdateModelEntitiesRequest();
      req.setUpdatesList([...clearEntities, ...highlightEntities]);
      this.client.updateModelEntities(req, meta, handler);
    });
  }

  private log(message?: string, ...optionalParams: unknown[]): void {
    if (this.debugLogs) {
      console.debug(message, optionalParams);
    }
  }
}
