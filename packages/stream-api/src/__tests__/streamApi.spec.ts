import {
  WebSocketClient,
  connectMock,
  restoreMocks,
  simulateResponse,
  closeMock,
} from '../__mocks__/webSocketClient';
import { StreamApi } from '../streamApi';
import { UrlDescriptor } from '../url';
import { UUID } from '@vertexvis/utils';

describe(StreamApi, () => {
  jest.setTimeout(100);
  const ws = new WebSocketClient();
  const api = new StreamApi(ws);
  const url = (): UrlDescriptor => ({
    url: 'ws://foo.com',
  });
  const frame = { frame: {} };

  beforeEach(() => {
    restoreMocks();
  });

  describe('connect', () => {
    it('should open a ws connection', () => {
      api.connect(url);
      expect(connectMock).toHaveBeenCalled();
    });

    it('should close ws when returned disposable is called', async () => {
      const disposable = await api.connect(url);
      disposable.dispose();
      expect(closeMock).toHaveBeenCalled();
    });
  });

  describe('send request', () => {
    beforeEach(() => api.connect(url));

    it('should complete promise when response is received with frame', () => {
      const result = api.beginInteraction();
      simulateResponse(frame);
      return result;
    });

    // it('should not complete a promise when response is received without frame', async () => {
    //   try {
    //     const result = await api.beginInteraction();
    //     simulateResponse({ error: {} });
    //     return result;
    //   } catch (e) {
    //     console.log(e);
    //   }
    // });

    it('should complete promise when response is received requestId matching request', () => {
      const requestId = UUID.create();
      const result = api.hitItems(requestId, {
        point: { x: 10, y: 10 },
      });
      simulateResponse({
        requestId: { value: requestId },
        hitItems: {},
      });
      return result;
    });
  });
});
