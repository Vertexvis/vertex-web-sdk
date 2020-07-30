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
jest.mock('@vertexvis/utils', () => {
  const utils = jest.requireActual('@vertexvis/utils');
  return {
    ...utils,
    UUID: {
      create: jest.fn().mockReturnValue('11111111-0000-1111-1111-111111111111'),
    },
  };
});
import { UUID } from '@vertexvis/utils';

describe(StreamApi, () => {
  const requestId = UUID.create();
  jest.setTimeout(100);
  const ws = new WebSocketClient();
  const streamApi = new StreamApi(ws);
  const url = (): UrlDescriptor => ({
    url: 'ws://foo.com',
  });

  beforeEach(() => {
    restoreMocks();
  });

  describe('connect', () => {
    it('should open a ws connection', () => {
      streamApi.connect(url);
      expect(connectMock).toHaveBeenCalled();
    });

    it('should close ws when returned disposable is called', async () => {
      const disposable = await streamApi.connect(url);
      disposable.dispose();
      expect(closeMock).toHaveBeenCalled();
    });
  });

  describe('reconnect', () => {
    beforeEach(() => streamApi.connect(url));
    it('should open a ws connection', () => {
      const reconnectPayload = {
        streamId: {
          hex: UUID.create(),
        },
        dimensions: {
          width: 500,
          height: 500,
        },
      };
      streamApi.reconnect(reconnectPayload);
      expect(connectMock).toHaveBeenCalled();
    });

    it('should throw if the url provider is not set', async () => {
      const reconnectPayload = {
        streamId: {
          hex: UUID.create(),
        },
        dimensions: {
          width: 500,
          height: 500,
        },
      };
      const newStreamApi = new StreamApi(ws);

      try {
        newStreamApi.reconnect(reconnectPayload);
      } catch (e) {
        expect(e).toEqual(
          new Error('Unable to connect as no Url provider has been set')
        );
      }
    });
  });

  describe('send createSceneAlteration', () => {
    beforeEach(() => streamApi.connect(url));

    it('should send a request with Id', () => {
      const request = {};
      streamApi.createSceneAlteration(request);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('send request', () => {
    beforeEach(() => streamApi.connect(url));

    it('should complete promise immediately when no requestId is provided', () => {
      const result = streamApi.beginInteraction(false);
      expect(sendMock).toHaveBeenCalled();
      return result;
    });

    it('should complete promise when response is received with requestId matching request', () => {
      const result = streamApi
        .hitItems(
          {
            point: { x: 10, y: 10 },
          },
          true
        )
        .then(resp => expect(resp).toBeDefined());
      simulateResponse({
        requestId: { value: requestId },
        hitItems: {},
      });
      expect(sendMock).toHaveBeenCalled();
      return result;
    });
  });

  describe('replace camera', () => {
    beforeEach(() => streamApi.connect(url));
    it('should complete promise with updated camera when requestId provided', () => {
      const result = streamApi
        .replaceCamera(
          {
            camera: {
              position: { x: 0, y: 0, z: 0 },
              lookAt: { x: 0, y: 0, z: 0 },
              up: { x: 0, y: 0, z: 0 },
            },
          },
          true
        )
        .then(resp => expect(resp).toBeDefined());
      simulateResponse({
        requestId: { value: requestId },
        updateCamera: {},
      });
      expect(sendMock).toHaveBeenCalled();
      return result;
    });
  });
});
