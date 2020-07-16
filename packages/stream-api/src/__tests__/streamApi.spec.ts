import {
  WebSocketClient,
  connectMock,
  restoreMocks,
  sendMock,
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

    it('should complete promise immediately when no requestId is provided', () => {
      const result = api.beginInteraction();
      expect(sendMock).toHaveBeenCalled();
      return result;
    });

    it('should complete promise when response is received with requestId matching request', () => {
      const requestId = UUID.create();
      const result = api.hitItems(requestId, {
        point: { x: 10, y: 10 },
      });
      simulateResponse({
        requestId: { value: requestId },
        hitItems: {},
      });
      expect(sendMock).toHaveBeenCalled();
      return result;
    });
  });

  describe('replace camera', () => {
    beforeEach(() => api.connect(url));
    it('should complete promise with updated camera when requestId provided', () => {
      const requestId = UUID.create();
      const result = api.replaceCamera(requestId, {
        camera: {
          position: { x: 0, y: 0, z: 0 },
          lookAt: { x: 0, y: 0, z: 0 },
          up: { x: 0, y: 0, z: 0 },
        },
      });
      simulateResponse({
        requestId: { value: requestId },
        updateCamera: {},
      });
      expect(sendMock).toHaveBeenCalled();
      return result;
    });
  });
});
