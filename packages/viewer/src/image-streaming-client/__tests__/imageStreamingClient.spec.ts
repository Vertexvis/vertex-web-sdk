import { WebSocketClient } from '../../websocket-client/webSocketClient';
import * as AttemptReconnect from '../reconnect';
import { ImageStreamingClient } from '../imageStreamingClient';
import { WebSocketMock } from '../__mocks__/webSocketMock';

describe('ImageStreamingClient', () => {
  let globalSetTimeout: any;
  let globalWebSocket: any;
  const now = 100;
  const start = 225;
  const end = 300;

  beforeAll(() => {
    globalSetTimeout = setTimeout;
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

  afterAll(() => {
    Object.defineProperty(global, 'setTimeout', { value: globalSetTimeout });
    Object.defineProperty(global, 'WebSocket', { value: globalWebSocket });
  });

  describe('reopen', () => {
    let imageStreamingClient: ImageStreamingClient;
    let websocketClient: WebSocketClient;
    beforeEach(() => {
      websocketClient = new WebSocketClient();
      imageStreamingClient = new ImageStreamingClient(websocketClient);
    });

    it('waits to close until the start time provided', async () => {
      await imageStreamingClient.reopen(
        AttemptReconnect.create('5000', `${start}`, `${end}`),
        now,
        start,
        end
      );

      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        start - now
      );
    });

    it('closes the websocket if the window end time is reached', async () => {
      await websocketClient.connect(() => ({ url: 'some-url' }));
      await imageStreamingClient.reopen(
        AttemptReconnect.create('5000', `${start}`, `${end}`),
        now,
        start,
        end
      );

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), end - now);
    });
  });
});
