import { Vector3 } from '@vertexvis/geometry';
import { ModelEntity } from '@vertexvis/scene-view-protos/core/protos/model_entity_pb';

import { random } from '../../../testing';
import { PreciseMeasurementEntity } from '../entities';
import { MeasurementModel } from '../model';
import { PreciseMeasurementOutcome } from '../outcomes';
import { MinimumDistanceMeasurementResult } from '../results';

describe('MeasurementModel', () => {
  const point = Vector3.create();
  const point2 = Vector3.create();
  const point3 = Vector3.create();
  const modelEntity = new ModelEntity().serializeBinary();
  const measureEntity = new PreciseMeasurementEntity(point, modelEntity);
  const measureEntity2 = new PreciseMeasurementEntity(point2, modelEntity);
  const measureEntity3 = new PreciseMeasurementEntity(point3, modelEntity);

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

  describe(MeasurementModel.prototype.clearEntities, () => {
    it('removes all results', () => {
      const model = new MeasurementModel();
      model.addEntity(measureEntity);

      model.clearEntities();
      expect(model.getEntities()).toEqual([]);
    });
  });

  describe(MeasurementModel.prototype.clearOutcome, () => {
    it('removes all results', () => {
      const model = new MeasurementModel();
      const outcome: PreciseMeasurementOutcome = {
        type: 'precise',
        results: [],
      };

      const onChange = jest.fn();
      model.setOutcome(outcome);
      model.onOutcomeChanged(onChange);

      model.clearOutcome();

      expect(onChange).toHaveBeenCalledWith(undefined);
      expect(model.getOutcome()).toEqual(undefined);
    });
  });

  describe(MeasurementModel.prototype.setOutcome, () => {
    it('replaces outcome', () => {
      const model = new MeasurementModel();
      const result1 = createMinimumDistanceResult();
      const result2 = createMinimumDistanceResult();
      const outcome: PreciseMeasurementOutcome = {
        type: 'precise',
        results: [result1, result2],
      };
      const onChange = jest.fn();

      model.onOutcomeChanged(onChange);

      model.setOutcome(outcome);
      expect(onChange).toHaveBeenCalledWith(outcome);
      expect(model.getOutcome()).toEqual(outcome);
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
