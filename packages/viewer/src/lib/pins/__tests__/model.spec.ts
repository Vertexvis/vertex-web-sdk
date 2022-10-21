import { Point, Vector3 } from '@vertexvis/geometry';

import { PinModel, TextPin } from '../model';

describe('PinModel', () => {
  describe(PinModel.prototype.setPin, () => {
    it('adds pin to the supplied set', () => {
      const model = new PinModel();
      const onChange = jest.fn();
      const onAdd = jest.fn();
      model.onEntitiesChanged(onChange);
      model.onPinAdded(onAdd);

      const pin: TextPin = {
        type: 'text',
        id: 'my-pin-id',
        worldPosition: Vector3.create(),
        label: {
          point: Point.create(),
          text: 'My New Pin',
        },
      };

      model.setPin(pin);
      expect(model.getPins()).toEqual([pin]);
      expect(onChange).toHaveBeenCalledWith([pin]);
      expect(onAdd).toHaveBeenCalledWith([pin]);
    });
  });

  describe(PinModel.prototype.addPin, () => {
    it('adds pin to the supplied set', () => {
      const model = new PinModel();
      const onChange = jest.fn();
      const onAdd = jest.fn();
      model.onEntitiesChanged(onChange);
      model.onPinAdded(onAdd);

      const pin: TextPin = {
        type: 'text',
        id: 'my-pin-id',
        worldPosition: Vector3.create(),
        label: {
          point: Point.create(),
          text: 'My New Pin',
        },
      };

      model.addPin(pin, false);
      expect(model.getPins()).toEqual([pin]);
      expect(onChange).toHaveBeenCalledWith([pin]);
      expect(onAdd).toHaveBeenCalledWith([pin]);
    });
  });
});
