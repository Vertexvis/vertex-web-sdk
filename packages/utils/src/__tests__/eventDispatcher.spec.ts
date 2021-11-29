import * as Async from '../async';
import { EventDispatcher } from '../eventDispatcher';

describe(EventDispatcher, () => {
  const dispatcher = new EventDispatcher<string>();

  describe(EventDispatcher.prototype.on, () => {
    it('invokes event listener when event emitted', () => {
      const listener = jest.fn();
      dispatcher.on(listener);
      dispatcher.emit('event');
      expect(listener).toHaveBeenCalledWith('event');
    });

    it('disposes of listener when subscription is disposed', () => {
      const listener = jest.fn();
      const subscription = dispatcher.on(listener);
      subscription.dispose();
      dispatcher.emit('event');
      expect(listener).not.toHaveBeenCalled();
    });

    it('disposes of listener when aborted', () => {
      const controller = new AbortController();
      const listener = jest.fn();
      dispatcher.on(listener, { abort: controller.signal });
      controller.abort();
      dispatcher.emit('event');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe(EventDispatcher.prototype.once, () => {
    it('resolves when event emitted', async () => {
      const pending = dispatcher.once();
      dispatcher.emit('event');
      await expect(pending).resolves.toBe('event');
    });

    it('does not resolve when aborted', async () => {
      const controller = new AbortController();
      const pending = dispatcher.once({ abort: controller.signal });
      controller.abort();
      dispatcher.emit('event');
      await expect(Async.timeout(10, pending)).rejects.toThrow();
    });
  });

  describe(EventDispatcher.prototype.onceWhen, () => {
    it('resolves when event matches predicate', async () => {
      const pending = dispatcher.onceWhen((e) => e === 'event');
      dispatcher.emit('nope');
      dispatcher.emit('event');
      await expect(pending).resolves.toBe('event');
    });

    it('does not resolve when aborted', async () => {
      const controller = new AbortController();
      const pending = dispatcher.onceWhen((e) => e === 'event', {
        abort: controller.signal,
      });
      controller.abort();
      dispatcher.emit('event');
      await expect(Async.timeout(10, pending)).rejects.toThrow();
    });
  });

  describe(EventDispatcher.prototype.onceWhen, () => {
    it('invokes listener when event matches predicate', async () => {
      const listener = jest.fn();
      dispatcher.when((e) => e === 'event', listener);
      dispatcher.emit('nope');
      dispatcher.emit('event');
      dispatcher.emit('event');
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('disposes listener when aborted', () => {
      const controller = new AbortController();
      const listener = jest.fn();
      dispatcher.when((e) => e === 'event', listener, {
        abort: controller.signal,
      });
      controller.abort();
      dispatcher.emit('event');
      expect(listener).not.toHaveBeenCalled();
    });

    it('disposes listener when subscription disposed', () => {
      const listener = jest.fn();
      const sub = dispatcher.when((e) => e === 'event', listener);
      sub.dispose();
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
