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
import { vertexvis } from '@vertexvis/frame-streaming-protos';

describe(StreamApi, () => {
  const requestId = UUID.create();
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

  describe('send createSceneAlteration', () => {
    beforeEach(() => api.connect(url));

    it('should send a request with Id', () => {
      const request: vertexvis.protobuf.stream.ICreateSceneAlterationRequest = {};
      api.createSceneAlteration(request);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('send request', () => {
    beforeEach(() => api.connect(url));

    it('should complete promise immediately when no requestId is provided', () => {
      const result = api.beginInteraction(false);
      expect(sendMock).toHaveBeenCalled();
      return result;
    });

    it('should complete promise when response is received with requestId matching request', () => {
      const result = api
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
    beforeEach(() => api.connect(url));
    it('should complete promise with updated camera when requestId provided', () => {
      const result = api
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
