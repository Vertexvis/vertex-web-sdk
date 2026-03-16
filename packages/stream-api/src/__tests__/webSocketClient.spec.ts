import { ConnectionDescriptor } from '../connection';
import { WebSocketClientImpl } from '../webSocketClient';

describe('WebSocketClientImpl', () => {
  const mockClose = jest.fn();
  let globalWebSocket: any;
  beforeAll(() => {
    globalWebSocket = global.WebSocket;
    (global as any).WebSocket = class {
      public addEventListener = jest.fn((eventType, listener) =>
        eventType === 'open' ? listener() : undefined
      );

      public removeEventListener = jest.fn();
      public close = mockClose;
    };
  });

  afterAll(() => {
    (global as any).WebSocket = globalWebSocket;
  });

  describe('connect', () => {
    it('closes any existing WebSocket associated to this client', async () => {
      const wsImpl = new WebSocketClientImpl();
      const descriptor: ConnectionDescriptor = {
        url: 'ws-url',
      };

      // Connect twice and verify that `close` is called on the existing WebSocket
      // connection to prevent open connection leaks.
      await wsImpl.connect(descriptor);
      await wsImpl.connect(descriptor);

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
