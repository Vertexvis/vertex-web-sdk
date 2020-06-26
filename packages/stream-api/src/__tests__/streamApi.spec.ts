import {
  WebSocketClient,
  connectMock,
  restoreMocks,
  simulateResponse,
  closeMock,
} from '../__mocks__/webSocketClient';
import { StreamApi } from '../streamApi';
import { UrlDescriptor } from '../url';

describe(StreamApi, () => {
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

    it('should complete promise when response is received', () => {
      const result = api.beginInteraction();
      simulateResponse(frame);
      return result;
    });
  });
});
