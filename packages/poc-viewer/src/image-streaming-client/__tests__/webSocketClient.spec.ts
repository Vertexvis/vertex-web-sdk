import { WebSocketClient } from '../webSocketClient';
import {
  WebSocketMock,
  addEventListenerMock,
  removeEventListenerMock,
} from '../__mocks__/webSocketMock';

describe('WebsocketClient', () => {
  let globalSetTimeout: any;
  let globalWebSocket: any;
  let websocketClient: WebSocketClient;

  beforeAll(() => {
    globalSetTimeout = global.setTimeout;
    globalWebSocket = window.WebSocket;

    Object.defineProperty(global, 'setTimeout', {
      writable: true,
      value: jest.fn((callback, time) => callback()),
    });
    Object.defineProperty(global, 'WebSocket', {
      writable: true,
      value: WebSocketMock,
    });
  });

  beforeEach(() => {
    addEventListenerMock.mockReset();
    removeEventListenerMock.mockReset();
    websocketClient = new WebSocketClient();
  });

  afterAll(() => {
    Object.defineProperty(global, 'setTimeout', { value: globalSetTimeout });
    Object.defineProperty(global, 'WebSocket', { value: globalWebSocket });
  });

  describe('connect', () => {
    it('removes event listeners on errors or close', async () => {
      await websocketClient.connect(() => 'some-url');
      websocketClient.close();

      expect(addEventListenerMock).toHaveBeenCalledTimes(4);
      expect(removeEventListenerMock).toHaveBeenCalledTimes(4);
    });
  });

  describe('reconnect', () => {
    beforeEach(() => {
      (global as any).WebSocket = class RejectingWebSocketMock extends WebSocketMock {
        public addEventListener(name, callback): void {
          if (name === 'error') {
            callback();
          }
        }
      };
    });

    it('increases the time for subsequent connection attempts', async () => {
      for (let i = 0; i < 10; i++) {
        await websocketClient.reconnect(() => 'some-url');
      }

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
    });

    it('increases the time for subsequent connection attempts according to passed values', async () => {
      websocketClient = new WebSocketClient([10000, 20000, 40000]);
      for (let i = 0; i < 10; i++) {
        await websocketClient.reconnect(() => 'some-url');
      }

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 20000);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 40000);
    });
  });
});
