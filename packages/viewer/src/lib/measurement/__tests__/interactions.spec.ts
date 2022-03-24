jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);
jest.mock('@vertexvis/stream-api');

import { Vector3 } from '@vertexvis/geometry';
import { MeasurementResult } from '@vertexvis/scene-view-protos/core/protos/measurement_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { StreamApi } from '@vertexvis/stream-api';
import { Async } from '@vertexvis/utils';

import {
  createMeasureResponse,
  createMinimumDistanceResult,
  eventually,
  mockGrpcUnaryResult,
  random,
} from '../../../testing';
import { CursorManager, measurementWithArrowCursor } from '../../cursors';
import { InteractionApiPerspective } from '../../interactions';
import { EntityType } from '../../types';
import { MeasurementController } from '../controller';
import { MeasurementInteractionHandler } from '../interactions';
import { MeasurementModel } from '../model';
import { MeasurementOutcome } from '../outcomes';

describe(MeasurementInteractionHandler, () => {
  const deviceId = random.guid();
  const model = new MeasurementModel();
  const client = new SceneViewAPIClient(random.url());
  const controller = new MeasurementController(
    model,
    client,
    () => 'token',
    deviceId
  );
  const handler = new MeasurementInteractionHandler(controller, [
    EntityType.PRECISE_SURFACE,
    EntityType.IMPRECISE_SURFACE,
  ]);

  const element = document.createElement('div');
  const api = new InteractionApiPerspective(
    new StreamApi(),
    new CursorManager(),
    jest.fn(),
    jest.fn(),
    jest.fn(),
    jest.fn(),
    { emit: jest.fn() },
    { emit: jest.fn() },
    { emit: jest.fn() },
    { emit: jest.fn() },
    { emit: jest.fn() }
  );

  beforeEach(() => {
    handler.dispose();
    handler.initialize(element, api);

    jest.resetAllMocks();
  });

  it('shows measurement cursor when pointer over measurable entity', async () => {
    const addCursor = jest.spyOn(api, 'addCursor');

    function reset(): void {
      addCursor.mockClear();
    }

    mockMeasurableEntityAtPoint(EntityType.PRECISE_SURFACE);
    element.dispatchEvent(new MouseEvent('pointermove'));
    await eventually(() => {
      expect(addCursor).toHaveBeenCalledWith(measurementWithArrowCursor);
    });
    reset();

    mockMeasurableEntityAtPoint(EntityType.PRECISE_EDGE);
    element.dispatchEvent(new MouseEvent('pointermove'));
    await eventually(() => {
      expect(addCursor).not.toHaveBeenCalled();
    });
    reset();

    mockMeasurableEntityAtPoint(EntityType.IMPRECISE_SURFACE);
    element.dispatchEvent(new MouseEvent('pointermove'));
    await eventually(() => {
      expect(addCursor).toHaveBeenCalledWith(measurementWithArrowCursor);
    });
    reset();

    mockMeasurableEntityAtPoint(EntityType.IMPRECISE_EDGE);
    element.dispatchEvent(new MouseEvent('pointermove'));
    await eventually(() => {
      expect(addCursor).not.toHaveBeenCalled();
    });
    reset();

    mockMeasurableEntityAtPoint(EntityType.CROSS_SECTION);
    element.dispatchEvent(new MouseEvent('pointermove'));
    await eventually(() => {
      expect(addCursor).not.toHaveBeenCalled();
    });
    reset();

    mockMeasurableEntityAtPoint(EntityType.GENERIC_GEOMETRY);
    element.dispatchEvent(new MouseEvent('pointermove'));
    await eventually(() => {
      expect(addCursor).not.toHaveBeenCalled();
    });
    reset();
  });

  it('measures entity when measurable entity is clicked', async () => {
    mockHit();
    mockMeasureResponse();
    mockMeasurableEntityAtPoint();

    await tap((outcome) => {
      expect(outcome).toMatchObject({
        results: expect.arrayContaining([
          expect.objectContaining({
            type: 'minimum-distance',
          }),
        ]),
      });
    });
  });

  it('clears measurements when click not over measurable entity', async () => {
    mockHit();
    mockMeasureResponse();

    mockMeasurableEntityAtPoint();
    await tap();

    mockUnmeasurableEntityAtPoint();
    await tap((outcome) => expect(outcome).toBeUndefined());
  });

  it('clears measurement entities when hit has no result', async () => {
    mockHit();
    mockMeasureResponse();

    mockMeasurableEntityAtPoint();
    await tap();

    mockNoHit();
    await tap((outcome) => expect(outcome).toBeUndefined());
  });

  it('does nothing if viewer has interaction between down and up', async () => {
    (api.hitItems as jest.Mock).mockResolvedValue([]);
    const addEntities = jest.spyOn(controller, 'addEntity');
    const clearEntities = jest.spyOn(controller, 'clearEntities');

    const down = new MouseEvent('pointerdown', { clientX: 0, clientY: 0 });
    const move = new MouseEvent('pointermove', { clientX: 10, clientY: 10 });
    const up = new MouseEvent('pointerup');

    element.dispatchEvent(down);
    window.dispatchEvent(move);
    window.dispatchEvent(up);

    await Async.delay(100);
    expect(addEntities).not.toHaveBeenCalled();
    expect(clearEntities).not.toHaveBeenCalled();
  });

  function mockHit(): void {
    jest
      .spyOn(api, 'hitItems')
      .mockResolvedValue([{ hitPoint: Vector3.create(), modelEntity: {} }]);
  }

  function mockNoHit(): void {
    jest.spyOn(api, 'hitItems').mockResolvedValue([]);
  }

  function mockMeasurableEntityAtPoint(
    type = EntityType.PRECISE_SURFACE
  ): void {
    const getEntityTypeAtPoint = jest.spyOn(api, 'getEntityTypeAtPoint');
    getEntityTypeAtPoint.mockResolvedValue(type);
  }

  function mockUnmeasurableEntityAtPoint(): void {
    const getEntityTypeAtPoint = jest.spyOn(api, 'getEntityTypeAtPoint');
    getEntityTypeAtPoint.mockResolvedValue(EntityType.GENERIC_GEOMETRY);
  }

  function mockMeasureResponse(
    result: MeasurementResult = createMinimumDistanceResult()
  ): void {
    (client.measure as jest.Mock).mockImplementation(
      mockGrpcUnaryResult(createMeasureResponse(result))
    );
  }

  async function tap(
    assertion?: (outcome: MeasurementOutcome | undefined) => void
  ): Promise<void> {
    const onOutcomeChanged = new Promise<MeasurementOutcome | undefined>(
      (resolve) => model.onOutcomeChanged(resolve)
    );

    element.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(new MouseEvent('pointerup'));

    const outcome = await onOutcomeChanged;
    assertion?.(outcome);
  }
});
