jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);

import { MeasureEntity } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
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

      const entity = new MeasureEntity();
      const results = await controller.addEntity(entity);

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

      const entity = new MeasureEntity();
      controller.addEntity(entity);
      const results = await controller.addEntity(entity);

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

      const entity = new MeasureEntity();
      await controller.addEntity(entity);

      (client.measure as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createMeasureResponse())
      );

      const results = await controller.removeEntity(entity);
      expect(results).toEqual([]);
    });
  });
});
