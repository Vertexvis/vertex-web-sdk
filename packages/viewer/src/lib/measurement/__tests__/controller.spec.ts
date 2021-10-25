jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);

import { Vector3 } from '@vertexvis/geometry';
import { ModelEntity } from '@vertexvis/scene-view-protos/core/protos/model_entity_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { MeasurementEntity } from '..';
import {
  createMeasureResponse,
  createMinimumDistanceResult,
  mockGrpcUnaryResult,
  random,
} from '../../../testing';
import { MeasurementController } from '../controller';
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

  const client = new SceneViewAPIClient(random.url());
  const jwtProvider = (): string => random.string();
  const controller = new MeasurementController(model, client, jwtProvider);

  beforeEach(() => {
    model.clearResults();
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
      const results = await controller.addEntity(entity2);

      expect(results).toEqual([
        expect.objectContaining({ type: 'minimum-distance' }),
      ]);
    });

    it('returns cached results', async () => {
      (client.measure as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createMeasureResponse(createMinimumDistanceResult())
        )
      );

      controller.addEntity(entity1);
      await controller.addEntity(entity2);
      const results = await controller.addEntity(entity2);

      expect(client.measure).toHaveBeenCalledTimes(1);
      expect(results).toEqual([
        expect.objectContaining({ type: 'minimum-distance' }),
      ]);
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

      const results = await controller.removeEntity(entity2);
      expect(results).toEqual([]);
    });
  });
});