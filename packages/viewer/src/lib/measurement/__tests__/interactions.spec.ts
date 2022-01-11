jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);
jest.mock('@vertexvis/stream-api');
jest.mock('../../interactions');

import { Vector3 } from '@vertexvis/geometry';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { StreamApi } from '@vertexvis/stream-api';
import { Async } from '@vertexvis/utils';

import { random } from '../../../testing';
import { InteractionApi } from '../../interactions';
import { MeasurementController } from '../controller';
import { PreciseMeasurementInteractionHandler } from '../interactions';
import { MeasurementModel } from '../model';

describe(PreciseMeasurementInteractionHandler, () => {
  const model = new MeasurementModel();
  const client = new SceneViewAPIClient(random.url());
  const controller = new MeasurementController(model, client, () => 'token');
  const handler = new PreciseMeasurementInteractionHandler(controller);

  const element = document.createElement('div');
  const api = new InteractionApi(
    new StreamApi(),
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

  it('adds measurement entity when hit has result', async () => {
    (api.hitItems as jest.Mock).mockResolvedValue([
      { hitPoint: Vector3.create(), modelEntity: {} },
    ]);
    const addEntity = jest.spyOn(controller, 'addEntity');
    const entitiesChanged = new Promise((resolve) =>
      model.onEntitiesChanged(resolve)
    );

    const down = new MouseEvent('pointerdown');
    const up = new MouseEvent('pointerup');
    element.dispatchEvent(down);
    window.dispatchEvent(up);

    await entitiesChanged;
    expect(addEntity).toHaveBeenCalled();
  });

  it('clears measurement entities when hit has no result', async () => {
    (api.hitItems as jest.Mock).mockResolvedValue([]);
    const clearEntities = jest.spyOn(controller, 'clearEntities');
    const entitiesChanged = new Promise((resolve) =>
      model.onEntitiesChanged(resolve)
    );

    const down = new MouseEvent('pointerdown');
    const up = new MouseEvent('pointerup');
    element.dispatchEvent(down);
    window.dispatchEvent(up);

    await entitiesChanged;
    expect(clearEntities).toHaveBeenCalled();
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
});
