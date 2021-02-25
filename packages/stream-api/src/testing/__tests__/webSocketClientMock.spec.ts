import { WebSocketClientMock } from '../webSocketClientMock';

describe(WebSocketClientMock, () => {
  const mock = new WebSocketClientMock();

  beforeEach(() => mock.reset());

  describe(WebSocketClientMock.prototype.send, () => {
    it('should add the message to the queue', () => {
      mock.send('123');
      expect(mock.nextSent()).toBe('123');
    });
  });

  describe(WebSocketClientMock.prototype.nextSent, () => {
    it('should take the next message in the queue', () => {
      mock.send('123');
      mock.send('234');
      expect(mock.nextSent()).toBe('123');
    });

    it('should error if queue is empty', () => {
      expect(() => mock.nextSent()).toThrowError();
    });

    it('should decode message with decoder', () => {
      mock.send('123');
      expect(mock.nextSent(str => parseInt(str.toString()))).toBe(123);
    });
  });

  describe(WebSocketClientMock.prototype.skipSent, () => {
    it('should skip N messages in the queue', () => {
      mock.send('123');
      mock.send('234');
      expect(mock.skipSent(1).nextSent()).toBe('234');
    });

    it('should error if N is larger than queue', () => {
      mock.send('123');
      expect(() => mock.skipSent(2)).toThrowError();
    });
  });

  describe(WebSocketClientMock.prototype.onMessage, () => {
    const handler = jest.fn();

    beforeEach(() => handler.mockClear());

    it('should invoke registered handlers', () => {
      mock.onMessage(handler);
      mock.receiveMessage('123');
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: '123',
        })
      );
    });

    it('should remove handler with returned disposable', () => {
      const subscription = mock.onMessage(handler);
      subscription.dispose();

      mock.receiveMessage('123');
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
