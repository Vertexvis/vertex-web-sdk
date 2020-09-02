jest.mock('@vertexvis/utils', () => {
  const utils = jest.requireActual('@vertexvis/utils');
  return {
    ...utils,
    UUID: {
      create: jest.fn().mockReturnValue('11111111-0000-1111-1111-111111111111'),
    },
  };
});

import { StreamApi } from '../streamApi';
import { UUID } from '@vertexvis/utils';
import { toProtoDuration } from '../time';
import { WebSocketClientMock } from '../testing';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

describe(StreamApi, () => {
  const requestId = UUID.create();
  const ws = new WebSocketClientMock();
  const streamApi = new StreamApi(ws);
  const descriptor = { url: 'ws://foo.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('connect', () => {
    it('should open a ws connection', () => {
      const connect = jest.spyOn(ws, 'connect');
      streamApi.connect(descriptor);
      expect(connect).toHaveBeenCalled();
    });

    it('should close ws when returned disposable is called', async () => {
      const close = jest.spyOn(ws, 'close');
      const disposable = await streamApi.connect(descriptor);
      disposable.dispose();
      expect(close).toHaveBeenCalled();
    });
  });

  describe('reconnect', () => {
    beforeEach(() => streamApi.connect(descriptor));

    it('should send a ws message to reconnect', () => {
      const send = jest.spyOn(ws, 'send');
      const reconnectPayload = {
        streamId: { hex: UUID.create() },
        dimensions: { width: 500, height: 500 },
      };
      streamApi.reconnect(reconnectPayload, false);
      expect(send).toHaveBeenCalled();
    });

    it('should throw if the url provider is not set', async () => {
      const reconnectPayload = {
        streamId: { hex: UUID.create() },
        dimensions: { width: 500, height: 500 },
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
    beforeEach(() => streamApi.connect(descriptor));

    it('should send a request with id', () => {
      const send = jest.spyOn(ws, 'send');
      const request = {};
      streamApi.createSceneAlteration(request);
      expect(send).toHaveBeenCalled();
    });
  });

  describe('send request', () => {
    beforeEach(() => streamApi.connect(descriptor));

    it('should complete promise immediately when no requestId is provided', async () => {
      const send = jest.spyOn(ws, 'send');
      await streamApi.beginInteraction(false);
      expect(send).toHaveBeenCalled();
    });

    it('should complete promise when response is received with requestId matching request', async () => {
      const send = jest.spyOn(ws, 'send');
      const result = streamApi.hitItems({ point: { x: 10, y: 10 } });

      ws.receiveMessage(
        vertexvis.protobuf.stream.StreamMessage.encode({
          sentAtTime: { seconds: 0, nanos: 0 },
          response: { requestId: { value: requestId } },
        }).finish()
      );

      const resp = await result;

      expect(resp).toBeDefined();
      expect(send).toHaveBeenCalled();
    });
  });

  describe('replace camera', () => {
    const camera = {
      position: { x: 0, y: 0, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 0, z: 0 },
    };

    beforeEach(() => streamApi.connect(descriptor));

    it('should complete promise with updated camera when requestId provided', async () => {
      const send = jest.spyOn(ws, 'send');
      const result = streamApi.replaceCamera({ camera });

      ws.receiveMessage(
        vertexvis.protobuf.stream.StreamMessage.encode({
          sentAtTime: { seconds: 0, nanos: 0 },
          response: { requestId: { value: requestId } },
        }).finish()
      );

      const resp = await result;

      expect(send).toHaveBeenCalled();
      expect(resp).toBeDefined();
    });
  });

  describe(StreamApi.prototype.replyResult, () => {
    const start = new Date('2020-08-01T18:00:00.000Z');
    const end = new Date('2020-08-01T18:01:00.100Z');

    const sendToReceiveDuration = toProtoDuration(start, end);
    const receiveToPaintDuration = toProtoDuration(start, end);

    it('should send result on the websocket', () => {
      const send = jest.spyOn(ws, 'send');
      const timing = {
        sequenceNumber: 1,
        sendToReceiveDuration,
        receiveToPaintDuration,
      };
      streamApi.replyResult('123', { drawFrame: { timing } });
      expect(send).toHaveBeenCalled();
    });
  });

  describe(StreamApi.prototype.replyError, () => {
    it('should send error on the websocket', () => {
      const send = jest.spyOn(ws, 'send');
      streamApi.replyError('123', {});
      expect(send).toHaveBeenCalled();
    });
  });
});
