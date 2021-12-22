import { MeasurementModel, MinimumDistanceMeasurementResult } from '../model';
import { random } from '../../../testing';
import { Vector3 } from '@vertexvis/geometry';
import { ModelEntity } from '@vertexvis/scene-view-protos/core/protos/model_entity_pb';
import { MeasurementEntity } from '..';

describe('MeasurementModel', () => {
  const point = Vector3.create();
  const point2 = Vector3.create();
  const point3 = Vector3.create();
  const modelEntity = new ModelEntity().serializeBinary();
  const measureEntity = new MeasurementEntity(point, modelEntity);
  const measureEntity2 = new MeasurementEntity(point2, modelEntity);
  const measureEntity3 = new MeasurementEntity(point3, modelEntity);

  describe(MeasurementModel.prototype.addEntity, () => {
    it('adds the entity if not registered', () => {
      const model = new MeasurementModel();

      expect(model.addEntity(measureEntity)).toBe(true);
      expect(model.getEntities()).toEqual([measureEntity]);
    });

    it('wont duplicate entities', () => {
      const model = new MeasurementModel();
      model.addEntity(measureEntity);

      expect(model.addEntity(measureEntity)).toBe(false);
      expect(model.getEntities()).toEqual([measureEntity]);
    });
  });

  describe(MeasurementModel.prototype.removeEntity, () => {
    it('removes entity if registered', () => {
      const model = new MeasurementModel();
      model.addEntity(measureEntity);

      expect(model.removeEntity(measureEntity)).toBe(true);
      expect(model.getEntities()).toEqual([]);
    });

    it('does not remove entity if unregistered', () => {
      const model = new MeasurementModel();

      expect(model.removeEntity(measureEntity)).toBe(false);
      expect(model.getEntities()).toEqual([]);
    });
  });

  describe(MeasurementModel.prototype.addResult, () => {
    it('adds result if model does not contain result', () => {
      const model = new MeasurementModel();
      const result = createMinimumDistanceResult();
      const onChange = jest.fn();
      model.onResultsChanged(onChange);

      expect(model.addResult(result)).toBe(true);
      expect(onChange).toHaveBeenCalledWith([result]);
      expect(model.getResults()).toEqual([result]);
    });

    it('wont duplicate results', () => {
      const model = new MeasurementModel();
      const result = createMinimumDistanceResult();
      const onChange = jest.fn();
      model.addResult(result);
      model.onResultsChanged(onChange);

      expect(model.addResult(result)).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
      expect(model.getResults()).toEqual([result]);
    });
  });

  describe(MeasurementModel.prototype.removeResult, () => {
    it('removes result', () => {
      const model = new MeasurementModel();
      const result = createMinimumDistanceResult();
      const onChange = jest.fn();
      model.addResult(result);
      model.onResultsChanged(onChange);

      expect(model.removeResult(result)).toBe(true);
      expect(onChange).toHaveBeenCalledWith([]);
      expect(model.getResults()).toEqual([]);
    });

    it('result must belong to model', () => {
      const model = new MeasurementModel();
      const result = createMinimumDistanceResult();
      const onChange = jest.fn();
      model.onResultsChanged(onChange);

      expect(model.removeResult(result)).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
      expect(model.getResults()).toEqual([]);
    });
  });

  describe(MeasurementModel.prototype.clearEntities, () => {
    it('removes all results', () => {
      const model = new MeasurementModel();
      model.addEntity(measureEntity);

      model.clearEntities();
      expect(model.getEntities()).toEqual([]);
    });
  });

  describe(MeasurementModel.prototype.clearResults, () => {
    it('removes all results', () => {
      const model = new MeasurementModel();
      const result1 = createMinimumDistanceResult();
      const result2 = createMinimumDistanceResult();
      const onChange = jest.fn();
      model.addResult(result1);
      model.addResult(result2);
      model.onResultsChanged(onChange);

      model.clearResults();

      expect(onChange).toHaveBeenCalled();
      expect(model.getResults()).toEqual([]);
    });
  });

  describe(MeasurementModel.prototype.replaceResultsWithOutcome, () => {
    it('replaces all results with results in outcome', () => {
      const model = new MeasurementModel();
      const result1 = createMinimumDistanceResult();
      const result2 = createMinimumDistanceResult();
      const result3 = createMinimumDistanceResult();
      const outcome = { results: [result2, result3] };
      const onChange = jest.fn();

      model.addResult(result1);
      model.onResultsChanged(onChange);

      model.replaceResultsWithOutcome(outcome);
      expect(onChange).toHaveBeenCalledWith([result2, result3]);
      expect(model.getResults()).toEqual([result2, result3]);
    });
  });

  describe(MeasurementModel.prototype.setEntities, () => {
    it('replaces all entities with the supplied set', () => {
      const model = new MeasurementModel();
      const onChange = jest.fn();
      model.onEntitiesChanged(onChange);

      model.addEntity(measureEntity);
      expect(model.setEntities(new Set([measureEntity2, measureEntity3]))).toBe(
        true
      );
      expect(model.getEntities()).toEqual([measureEntity2, measureEntity3]);
      expect(onChange).toHaveBeenCalledWith([measureEntity2, measureEntity3]);
    });
  });
});

function createMinimumDistanceResult(): MinimumDistanceMeasurementResult {
  return {
    type: 'minimum-distance',
    distance: random.floating(),
    closestPoint1: Vector3.create(
      random.floating(),
      random.floating(),
      random.floating()
    ),
    closestPoint2: Vector3.create(
      random.floating(),
      random.floating(),
      random.floating()
    ),
  };
}
