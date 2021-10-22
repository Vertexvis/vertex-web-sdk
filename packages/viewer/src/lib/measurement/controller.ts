import {
  MeasureRequest,
  MeasureResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import {
  MeasurementModel,
  MeasurementOutcome,
  MeasurementResult,
} from './model';
import { mapMeasureResponseOrThrow } from './mapper';
import { MeasurementEntity } from '.';

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
  public async addEntity(
    entity: MeasurementEntity
  ): Promise<MeasurementResult[]> {
    if (this.model.addEntity(entity)) {
      this.measureAndUpdateModel();
    }
    return this.results;
  }

  /**
   * Deregisters an entity and performs a measurement if this entity was
   * removed.
   *
   * @param entity The entity to remove.
   * @returns A promise that resolves with the results after removing this
   * entity.
   */
  public async removeEntity(
    entity: MeasurementEntity
  ): Promise<MeasurementResult[]> {
    if (this.model.removeEntity(entity)) {
      this.measureAndUpdateModel();
    }
    return this.results;
  }

  private measureAndUpdateModel(): void {
    // For now, only request measurements if there are more than two entities.
    // This is temporary as we'll need to support passing a single entity for
    // area measurements.
    if (this.model.getEntities().length > 1) {
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

    const res = await requestUnary<MeasureResponse>((handler) => {
      const meta = createMetadata(this.jwtProvider);
      const req = new MeasureRequest();
      req.setEntitiesList(entities);

      this.client.measure(req, meta, handler);
    });

    return mapMeasureResponseOrThrow(res.toObject());
  }
}
