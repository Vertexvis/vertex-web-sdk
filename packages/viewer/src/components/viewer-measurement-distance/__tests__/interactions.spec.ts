jest.mock('../hitTest');
jest.mock('../../../lib/scenes');

import { Vector3 } from '@vertexvis/geometry';
import { Async } from '@vertexvis/utils';

import {
  makeHitProvider,
  makeHitTester,
  makeRaycaster,
} from '../../../testing/fixtures';
import { randomPoint, randomVector3 } from '../../../testing/random';
import {
  PointToPointInteractionController,
  PointToPointInteractionModel,
  PointToPointMeasurementResult,
} from '../interactions';

describe(PointToPointInteractionController, () => {
  let model!: PointToPointInteractionModel;
  let controller!: PointToPointInteractionController;

  const pt = randomPoint();
  const vec = randomVector3();
  const start = randomVector3();
  const end = randomVector3();
  const hitStart = randomVector3();
  const hitEnd = randomVector3();

  beforeEach(() => {
    model = PointToPointInteractionModel.empty();
    controller = new PointToPointInteractionController(model);

    jest.restoreAllMocks();
  });

  describe(PointToPointInteractionController.prototype.newMeasurement, () => {
    it('returns interaction handler if pt is over geometry', () => {
      const hitTester = makeHitTester();
      const hits = makeHitProvider({ hitTester });
      (hitTester.transformPointToWorld as jest.Mock).mockReturnValue(vec);

      const interaction = controller.newMeasurement(pt, hits);
      expect(interaction).toBeDefined();
    });

    it('does not return interaction handler if world pt cannot be found', () => {
      const hitTester = makeHitTester();
      const hits = makeHitProvider({ hitTester });
      (hitTester.transformPointToWorld as jest.Mock).mockReturnValue(undefined);

      const interaction = controller.newMeasurement(pt, hits);
      expect(interaction).toBeUndefined();
    });

    it('update returns valid measurement if over geometry', async () => {
      const hitTester = makeHitTester();
      const raycaster = makeRaycaster();
      const hits = makeHitProvider({ hitTester, raycaster });

      (hitTester.hitTest as jest.Mock).mockReturnValue(true);
      (hitTester.transformPointToWorld as jest.Mock).mockReturnValue(start);
      (raycaster.hitItems as jest.Mock).mockReturnValueOnce(
        Async.delay(50, Promise.resolve({ hits: [{ hitPoint: hitStart }] }))
      );

      const interaction = controller.newMeasurement(pt, hits);

      (hitTester.transformPointToWorld as jest.Mock).mockReturnValue(end);
      let res = interaction?.update(pt, hits);
      expect(res).toMatchObject({ start, end, valid: true });
      expect(model.getMeasurement()).toMatchObject({ start, end, valid: true });
      expect(model.getIndicator()).toEqual(end);

      (raycaster.hitItems as jest.Mock).mockReturnValueOnce(
        Promise.resolve({ hits: [{ hitPoint: hitEnd }] })
      );
      res = await interaction?.finish(pt, hits);
      expect(res).toMatchObject({ start: hitStart, end: hitEnd, valid: true });
      expect(model.getMeasurement()).toMatchObject({
        start: hitStart,
        end: hitEnd,
        valid: true,
      });
      expect(model.getIndicator()).toBeUndefined();
    });

    it('update returns invalid measurement if not over geometry', async () => {
      const hitTester = makeHitTester();
      const raycaster = makeRaycaster();
      const hits = makeHitProvider({ hitTester, raycaster });

      (hitTester.hitTest as jest.Mock).mockReturnValue(true);
      (hitTester.transformPointToWorld as jest.Mock)
        .mockReturnValueOnce(start)
        .mockReturnValueOnce(end)
        .mockReturnValueOnce(start)
        .mockReturnValueOnce(end);

      const interaction = controller.newMeasurement(pt, hits);

      (hitTester.hitTest as jest.Mock).mockReturnValue(false);
      let res = interaction?.update(pt, hits);
      expect(res).toMatchObject({ start, end, valid: false });
      expect(model.getMeasurement()).toMatchObject({
        start,
        end,
        valid: false,
      });
      expect(model.getIndicator()).toEqual(end);

      res = await interaction?.finish(pt, hits);
      expect(res).toMatchObject({ start, end, valid: false });
      expect(model.getMeasurement()).toMatchObject({
        start,
        end,
        valid: false,
      });
      expect(model.getIndicator()).toBeUndefined();
    });
  });

  describe(PointToPointInteractionController.prototype.editMeasurement, () => {
    const measurement: PointToPointMeasurementResult = {
      start: randomVector3(),
      end: randomVector3(),
      valid: true,
    };

    beforeEach(() => model.setMeasurement(measurement));

    describe('start anchor', () => {
      it('update returns valid measurement if over geometry', async () => {
        const hitTester = makeHitTester();
        const raycaster = makeRaycaster();
        const hits = makeHitProvider({ hitTester, raycaster });

        (hitTester.hitTest as jest.Mock).mockReturnValue(true);
        (hitTester.transformPointToWorld as jest.Mock).mockReturnValueOnce(
          start
        );

        const interaction = controller.editMeasurement('start');

        let res = interaction.update(pt, hits);
        expect(res).toMatchObject({ start, end: measurement.end, valid: true });
        expect(model.getMeasurement()).toMatchObject({
          start,
          end: measurement.end,
          valid: true,
        });
        expect(model.getIndicator()).toEqual(start);

        (raycaster.hitItems as jest.Mock).mockReturnValueOnce(
          Promise.resolve({ hits: [{ hitPoint: hitStart }] })
        );
        res = await interaction.finish(pt, hits);
        expect(res).toMatchObject({
          start: hitStart,
          end: measurement.end,
          valid: true,
        });
        expect(model.getIndicator()).toBeUndefined();
      });

      it('update returns invalid measurement if not over geometry', async () => {
        const hitTester = makeHitTester();
        const raycaster = makeRaycaster();
        const hits = makeHitProvider({ hitTester, raycaster });

        (hitTester.hitTest as jest.Mock).mockReturnValue(false);
        (hitTester.transformPointToWorld as jest.Mock)
          .mockReturnValueOnce(start)
          .mockReturnValueOnce(start);

        const interaction = controller.editMeasurement('start');

        let res = interaction.update(pt, hits);
        expect(res).toMatchObject({
          start,
          end: measurement.end,
          valid: false,
        });
        expect(model.getMeasurement()).toMatchObject({
          start,
          end: measurement.end,
          valid: false,
        });
        expect(model.getIndicator()).toEqual(start);

        res = await interaction.finish(pt, hits);
        expect(res).toMatchObject({
          start,
          end: measurement.end,
          valid: false,
        });
        expect(model.getIndicator()).toBeUndefined();
      });
    });

    describe('end anchor', () => {
      it('update returns valid measurement if over geometry', async () => {
        const hitTester = makeHitTester();
        const raycaster = makeRaycaster();
        const hits = makeHitProvider({ hitTester, raycaster });

        (hitTester.hitTest as jest.Mock).mockReturnValue(true);
        (hitTester.transformPointToWorld as jest.Mock).mockReturnValueOnce(end);

        const interaction = controller.editMeasurement('end');

        let res = interaction.update(pt, hits);
        expect(res).toMatchObject({
          start: measurement.start,
          end,
          valid: true,
        });
        expect(model.getMeasurement()).toMatchObject({
          start: measurement.start,
          end,
          valid: true,
        });
        expect(model.getIndicator()).toEqual(end);

        (raycaster.hitItems as jest.Mock).mockReturnValueOnce(
          Promise.resolve({ hits: [{ hitPoint: hitEnd }] })
        );
        res = await interaction.finish(pt, hits);
        expect(res).toMatchObject({
          start: measurement.start,
          end: hitEnd,
          valid: true,
        });
        expect(model.getIndicator()).toBeUndefined();
      });

      it('update returns invalid measurement if not over geometry', async () => {
        const hitTester = makeHitTester();
        const raycaster = makeRaycaster();
        const hits = makeHitProvider({ hitTester, raycaster });

        (hitTester.hitTest as jest.Mock).mockReturnValue(false);
        (hitTester.transformPointToWorld as jest.Mock)
          .mockReturnValueOnce(end)
          .mockReturnValueOnce(end);

        const interaction = controller.editMeasurement('end');

        let res = interaction.update(pt, hits);
        expect(res).toMatchObject({
          start: measurement.start,
          end,
          valid: false,
        });
        expect(model.getMeasurement()).toMatchObject({
          start: measurement.start,
          end,
          valid: false,
        });
        expect(model.getIndicator()).toEqual(end);

        res = await interaction.finish(pt, hits);
        expect(res).toMatchObject({
          start: measurement.start,
          end,
          valid: false,
        });
        expect(model.getIndicator()).toBeUndefined();
      });
    });
  });
});

describe(PointToPointInteractionModel, () => {
  const vec = randomVector3();
  const start = randomVector3();
  const end = randomVector3();
  const measurement: PointToPointMeasurementResult = {
    start,
    end,
    distance: Vector3.distance(start, end),
    valid: true,
  };

  let model!: PointToPointInteractionModel;

  beforeEach(() => {
    model = PointToPointInteractionModel.empty();
  });

  describe(PointToPointInteractionModel.prototype.setIndicator, () => {
    it('updates indicator and emits event', () => {
      const handleIndicatorChanged = jest.fn();

      model.onIndicatorChanged(handleIndicatorChanged);
      model.setIndicator(vec);

      expect(model.getIndicator()).toEqual(vec);
      expect(handleIndicatorChanged).toHaveBeenCalled();
    });

    it('does not emit event if value is same', () => {
      const handleIndicatorChanged = jest.fn();

      model.onIndicatorChanged(handleIndicatorChanged);
      model.setIndicator(vec);
      model.setIndicator(vec);

      expect(model.getIndicator()).toEqual(vec);
      expect(handleIndicatorChanged).toHaveBeenCalledTimes(1);
    });
  });

  describe(PointToPointInteractionModel.prototype.setMeasurement, () => {
    it('updates measurement and emits event', () => {
      const handleMeasurementChanged = jest.fn();

      model.onMeasurementChanged(handleMeasurementChanged);
      model.setMeasurement(measurement);

      expect(model.getMeasurement()).toEqual(measurement);
      expect(handleMeasurementChanged).toHaveBeenCalled();
    });

    it('does not emit event if value is same', () => {
      const handleMeasurementChanged = jest.fn();

      model.onMeasurementChanged(handleMeasurementChanged);
      model.setMeasurement(measurement);
      model.setMeasurement(measurement);

      expect(model.getMeasurement()).toEqual(measurement);
      expect(handleMeasurementChanged).toHaveBeenCalledTimes(1);
    });
  });

  describe(
    PointToPointInteractionModel.prototype.setMeasurementFromValues,
    () => {
      it('sets measurement if start and end defined', () => {
        const handleMeasurementChanged = jest.fn();

        model.onMeasurementChanged(handleMeasurementChanged);
        model.setMeasurementFromValues(start, end, true);

        expect(model.getMeasurement()).toEqual(measurement);
        expect(handleMeasurementChanged).toHaveBeenCalled();
      });

      it('does not set measurement if start or end undefined', () => {
        const handleMeasurementChanged = jest.fn();

        model.onMeasurementChanged(handleMeasurementChanged);
        model.setMeasurementFromValues(undefined, end, true);
        model.setMeasurementFromValues(start, undefined, true);

        expect(model.getMeasurement()).toBeUndefined();
        expect(handleMeasurementChanged).not.toHaveBeenCalled();
      });
    }
  );
});
