import { EventDispatcher } from '../eventDispatcher';

describe(EventDispatcher, () => {
  const dispatcher = new EventDispatcher<string>();

  describe(EventDispatcher.prototype.on, () => {
    it('should add an event listener', () => {
      const listener = jest.fn();
      dispatcher.on(listener);
      dispatcher.emit('event');
      expect(listener).toHaveBeenCalledWith('event');
    });

    it('should dispose of listener when subscription is disposed', () => {
      const listener = jest.fn();
      const subscription = dispatcher.on(listener);
      subscription.dispose();
      dispatcher.emit('event');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe(EventDispatcher.prototype.off, () => {
    it('should remove event listener', () => {
      const listener = jest.fn();
      dispatcher.on(listener);
      dispatcher.off(listener);
      dispatcher.emit('event');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
