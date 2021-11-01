import {
  MeasureRequest,
  MeasureResponse,
  ModelEntityUpdate,
  UpdateModelEntitiesRequest,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import {
  MeasurementModel,
  MeasurementOutcome,
  MeasurementResult,
} from './model';
import { mapMeasureResponseOrThrow } from './mapper';
import { MeasurementEntity } from './model';
import { ModelEntity } from '@vertexvis/scene-view-protos/core/protos/model_entity_pb';
import { BoolValue } from 'google-protobuf/google/protobuf/wrappers_pb';

/**
 * The `MeasurementController` is responsible for performing measurements of
 * registered entities, and updating the model with their measurement results.
 */
export class MeasurementController {
  private results = Promise.resolve<MeasurementResult[]>([]);

  public constructor(
    private model: MeasurementModel,
    private client: SceneViewAPIClient,
    private jwtProvider: JwtProvider
  ) {}

  /**
   * Registers an entity to measure and performs a measurement if this entity
   * has not been previously registered.
   *
   * @param entity The entity to measure.
   * @returns A promise that resolves with the results after registering this
   * entity.
   */
  public addEntity(entity: MeasurementEntity): Promise<MeasurementResult[]> {
    return this.performMeasurement(() => this.model.addEntity(entity));
  }

  /**
   * Clears all entities and returns a promise that resolves with an empty list
   * of measurement results.
   */
  public clearEntities(): Promise<MeasurementResult[]> {
    return this.performMeasurement(() => {
      this.model.clearEntities();
      this.model.clearResults();
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
  public removeEntity(entity: MeasurementEntity): Promise<MeasurementResult[]> {
    return this.performMeasurement(() => this.model.removeEntity(entity));
  }

  private performMeasurement(f: () => boolean): Promise<MeasurementResult[]> {
    const previous = this.model.getEntities();
    const changed = f();
    const entities = this.model.getEntities();
    if (changed) {
      this.measureAndUpdateModel(entities);
      this.highlightEntities(previous, entities);
    }
    return this.results;
  }

  private measureAndUpdateModel(entities: MeasurementEntity[]): void {
    // For now, only request measurements if there are more than two entities.
    // This is temporary as we'll need to support passing a single entity for
    // area measurements.
    if (entities.length > 1) {
      this.results = this.measureEntities().then((outcome) => {
        this.model.replaceResultsWithOutcome(outcome);
        return this.model.getResults();
      });
    } else {
      this.results = Promise.resolve([]);
    }
  }

  private async measureEntities(): Promise<MeasurementOutcome> {
    const entities = this.model.getEntities().map((e) => e.toProto());

    const res = await requestUnary<MeasureResponse>(async (handler) => {
      const meta = await createMetadata(this.jwtProvider);
      const req = new MeasureRequest();
      req.setEntitiesList(entities);

      this.client.measure(req, meta, handler);
    });

    return mapMeasureResponseOrThrow(res.toObject());
  }

  private async highlightEntities(
    previous: MeasurementEntity[],
    entities: MeasurementEntity[]
  ): Promise<void> {
    await requestUnary(async (handler) => {
      const meta = await createMetadata(this.jwtProvider);

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
