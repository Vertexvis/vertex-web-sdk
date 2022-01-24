jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);

import { Vector3 } from '@vertexvis/geometry';
import { ModelEntity } from '@vertexvis/scene-view-protos/core/protos/model_entity_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';

import {
  createMeasureResponse,
  createMinimumDistanceResult,
  mockGrpcUnaryResult,
  random,
} from '../../../testing';
import { MeasurementController } from '../controller';
import { MeasurementEntity } from '../entities';
import { MeasurementModel } from '../model';

describe('MeasurementController', () => {
  const model = new MeasurementModel();
  const entity1 = new MeasurementEntity(
    Vector3.create(),
    new ModelEntity().serializeBinary()
  );
  const entity2 = new MeasurementEntity(
    Vector3.create(),
    new ModelEntity().serializeBinary()
  );
  const entity3 = new MeasurementEntity(
    Vector3.create(),
    new ModelEntity().serializeBinary()
  );

  const client = new SceneViewAPIClient(random.url());
  const jwtProvider = (): string => random.string();
  const deviceId = random.string();
  const controller = new MeasurementController(
    model,
    client,
    jwtProvider,
    deviceId
  );

  beforeEach(() => {
    model.clearOutcome();
    model.clearEntities();
    jest.resetAllMocks();
  });

  describe(MeasurementController.prototype.addEntity, () => {
    it('returns measurement results if entity unregistered', async () => {
      (client.measure as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createMeasureResponse(createMinimumDistanceResult())
        )
      );

      await controller.addEntity(entity1);
      const outcome = await controller.addEntity(entity2);

      expect(outcome).toMatchObject({
        results: [expect.objectContaining({ type: 'minimum-distance' })],
      });
    });

    it('returns cached results', async () => {
      (client.measure as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createMeasureResponse(createMinimumDistanceResult())
        )
      );

      controller.addEntity(entity1);
      await controller.addEntity(entity2);
      const outcome = await controller.addEntity(entity2);

      expect(client.measure).toHaveBeenCalledTimes(2);
      expect(outcome).toMatchObject({
        results: [expect.objectContaining({ type: 'minimum-distance' })],
      });
    });
  });

  describe(MeasurementController.prototype.clearEntities, () => {
    it('clears entities and results', async () => {
      (client.measure as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createMeasureResponse(createMinimumDistanceResult())
        )
      );

      controller.addEntity(entity1);
      await controller.addEntity(entity2);

      await controller.clearEntities();
      expect(model.getEntities()).toEqual([]);
      expect(model.getResults()).toEqual([]);
    });
  });

  describe(MeasurementController.prototype.removeEntity, () => {
    it('returns measurement results if entity registered', async () => {
      (client.measure as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createMeasureResponse(createMinimumDistanceResult())
        )
      );

      await controller.addEntity(entity1);
      await controller.addEntity(entity2);

      (client.measure as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createMeasureResponse())
      );

      const outcome = await controller.removeEntity(entity2);
      expect(outcome).toMatchObject({ results: [] });
    });
  });

  describe(MeasurementController.prototype.setEntities, () => {
    it('replaces entities and returns measurement results', async () => {
      (client.measure as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createMeasureResponse(createMinimumDistanceResult())
        )
      );

      await controller.addEntity(entity1);
      const results = await controller.setEntities(new Set([entity2, entity3]));

      expect(model.getEntities()).toEqual([entity2, entity3]);
      expect(results).toMatchObject({
        results: [expect.objectContaining({ type: 'minimum-distance' })],
      });
    });
  });
});
