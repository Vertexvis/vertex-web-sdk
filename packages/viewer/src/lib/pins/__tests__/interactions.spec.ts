import { Point, Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { eventually } from '../../../testing';
import { CursorManager, labelPinCursor, pinCursor } from '../../cursors';
import { InteractionApiPerspective } from '../../interactions';
import { EntityType } from '../../types';
import { PinController } from '../controller';
import { PinsInteractionHandler } from '../interactions';
import { PinModel, TextPin } from '../model';

describe('PinsInteractionHandler', () => {
  const model = new PinModel();
  const controller = new PinController(model);

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

  const pin: TextPin = {
    type: 'text',
    id: 'my-pin-id',
    worldPosition: Vector3.create(),
    label: {
      point: Point.create(),
      text: 'My New Pin',
    },
  };

  const element = document.createElement('div');
  const handler = new PinsInteractionHandler(controller);

  beforeEach(() => {
    handler.dispose();
    handler.initialize(element, api);

    controller.setDraggable(undefined);

    controller.addPin(pin);
    jest.resetAllMocks();
  });

  it('supports dragging pins', async () => {
    controller.setDraggable({
      id: pin.id,
    });

    mockDroppableSurface();
    mockGetWorldPointFromViewport();
    element.dispatchEvent(new MouseEvent('pointermove'));

    await eventually(() => {
      const updatedPoint = model.getPinById(pin.id);
      expect(updatedPoint?.worldPosition).toEqual({
        x: 1,
        y: 2,
        z: 3,
      });
    });
  });

  it('supports switching the cursor when over geometry', async () => {
    const addCursor = jest.spyOn(api, 'addCursor');
    controller.setToolMode('edit');

    function reset(): void {
      addCursor.mockClear();
    }

    mockDroppableSurface();
    element.dispatchEvent(new MouseEvent('pointermove'));

    await eventually(() => {
      expect(addCursor).toHaveBeenCalledWith(pinCursor);
    });
    reset();

    controller.setToolType('pin-text');

    element.dispatchEvent(new MouseEvent('pointermove'));

    await eventually(() => {
      expect(addCursor).toHaveBeenCalledWith(labelPinCursor);
    });
    reset();
  });

  function mockDroppableSurface(type = EntityType.GENERIC_GEOMETRY): void {
    const getEntityTypeAtPoint = jest.spyOn(api, 'getEntityTypeAtPoint');
    getEntityTypeAtPoint.mockResolvedValue(type);
  }

  function mockGetWorldPointFromViewport(
    mockedPoint = Vector3.create(1, 2, 3)
  ): void {
    const getWorldPointFromViewport = jest.spyOn(
      api,
      'getWorldPointFromViewport'
    );
    getWorldPointFromViewport.mockResolvedValue(mockedPoint);
  }
});
