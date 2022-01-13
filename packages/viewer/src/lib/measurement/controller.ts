import { Vector3 } from '@vertexvis/geometry';
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
import { ImpreciseMeasurementEntity } from '.';
import { MeasurementEntity, PreciseMeasurementEntity } from './entities';
import { mapMeasureResponseOrThrow } from './mapper';
import { MeasurementModel } from './model';
import { MeasurementOutcome } from './outcomes';

/**
 * The `MeasurementController` is responsible for performing measurements of
 * registered entities, and updating the model with their measurement results.
 */
export class MeasurementController {
  private outcome = Promise.resolve<MeasurementOutcome | undefined>(undefined);

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
    entity: PreciseMeasurementEntity
  ): Promise<MeasurementOutcome | undefined> {
    return this.performMeasurement(() => this.model.addEntity(entity));
  }

  /**
   * Clears all entities and returns a promise that resolves with an empty list
   * of measurement results.
   */
  public clearEntities(): Promise<MeasurementOutcome | undefined> {
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
    entity: PreciseMeasurementEntity
  ): Promise<MeasurementOutcome | undefined> {
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
    entities: Set<PreciseMeasurementEntity>
  ): Promise<MeasurementOutcome | undefined> {
    return this.performMeasurement(() => this.model.setEntities(entities));
  }

  private performMeasurement(
    effect: () => boolean
  ): Promise<MeasurementOutcome | undefined> {
    const previous = this.model.getPreciseEntities();
    const changed = effect();
    const entities = this.model.getPreciseEntities();
    if (changed) {
      this.measureAndUpdateModel(entities);
      this.highlightEntities(previous, entities);
    }
    return this.outcome;
  }

  private measureAndUpdateModel(entities: MeasurementEntity[]): void {
    if (entities.length > 0) {
      this.outcome = this.measureEntities().then((outcome) => {
        this.model.setOutcome(outcome);
        return this.model.getOutcome();
      });
    } else {
      this.outcome = Promise.resolve(undefined);
    }
  }

  private async measureEntities(): Promise<MeasurementOutcome | undefined> {
    const impreciseEntities = this.model.getImpreciseEntities();
    const preciseEntities = this.model.getPreciseEntities();

    // TODO(dan): prob need to revisit logic here.
    if (impreciseEntities.length > 0) {
      return this.measureImpreciseEntities(impreciseEntities);
    } else if (preciseEntities.length > 0) {
      return this.measurePreciseEntities(preciseEntities);
    } else {
      return undefined;
    }
  }

  private async measurePreciseEntities(
    entities: PreciseMeasurementEntity[]
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

  private measureImpreciseEntities(
    entities: ImpreciseMeasurementEntity[]
  ): MeasurementOutcome | undefined {
    const [startE, endE] = entities;

    if (startE != null && endE != null) {
      return {
        type: 'imprecise',
        result: {
          type: 'point-to-point',
          start: startE.point,
          end: endE.point,
          distance: Vector3.distance(startE.point, endE.point),
          valid: true,
        },
      };
    } else {
      return undefined;
    }
  }

  private async highlightEntities(
    previous: PreciseMeasurementEntity[],
    entities: PreciseMeasurementEntity[]
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
}
