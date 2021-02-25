jest.mock('@vertexvis/utils', () => {
  const utils = jest.requireActual('@vertexvis/utils');
  return {
    ...utils,
    UUID: { create: jest.fn() },
  };
});

import { StreamApi } from '../streamApi';
import { UUID } from '@vertexvis/utils';
import { toProtoDuration, currentDateAsProtoTimestamp } from '../time';
import { WebSocketClientMock } from '../testing';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { decode } from '../encoder';

describe(StreamApi, () => {
  const ws = new WebSocketClientMock();
  const streamApi = new StreamApi(ws, false);
  const descriptor = { url: 'ws://foo.com' };

  const connect = jest.spyOn(ws, 'connect');
  const close = jest.spyOn(ws, 'close');
  const send = jest.spyOn(ws, 'send');

  beforeEach(() => {
    jest.clearAllMocks();
    ws.reset();
  });

  describe('connect', () => {
    it('opens a ws connection', () => {
      streamApi.connect(descriptor);
      expect(connect).toHaveBeenCalled();
    });

    it('closes ws when returned disposable is called', async () => {
      const disposable = await streamApi.connect(descriptor);
      disposable.dispose();
      expect(close).toHaveBeenCalled();
    });
  });

  describe('send request', () => {
    beforeEach(async () => {
      await streamApi.connect(descriptor);
    });

    it('resolves immediately when no requestId is provided', async () => {
      await streamApi.beginInteraction(false);
      expect(send).toHaveBeenCalled();
    });

    it('includes sent at time for requests with responses', async () => {
      const requestId = mockRequestId();
      const request = streamApi.endInteraction(true);
      ws.receiveMessage(
        vertexvis.protobuf.stream.StreamMessage.encode({
          sentAtTime: { seconds: 0, nanos: 0 },
          response: { requestId: { value: requestId }, endInteraction: {} },
        }).finish()
      );
      await request;
      expect(ws.nextSent(d => decode(d as Uint8Array))).toMatchObject({
        sentAtTime: expect.anything(),
      });
    });

    it('includes sent at time for requests without responses', () => {
      streamApi.syncTime({ requestTime: currentDateAsProtoTimestamp() }, false);
      expect(ws.nextSent(d => decode(d as Uint8Array))).toMatchObject({
        sentAtTime: expect.anything(),
      });
    });

    it('resolves when response is received with matching request id', async () => {
      const requestId = mockRequestId();
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

    it('rejects when response is an error', async () => {
      const requestId = mockRequestId();
      const result = streamApi.recordPerformance({ timings: [] }, true);

      ws.receiveMessage(
        vertexvis.protobuf.stream.StreamMessage.encode({
          sentAtTime: { seconds: 0, nanos: 0 },
          response: { requestId: { value: requestId }, error: {} },
        }).finish()
      );

      await expect(result).rejects.toThrowError();
    });
  });

  describe(StreamApi.prototype.replyResult, () => {
    const start = new Date('2020-08-01T18:00:00.000Z');
    const end = new Date('2020-08-01T18:01:00.100Z');

    const sendToReceiveDuration = toProtoDuration(start, end);

    it('sends result on the websocket', () => {
      streamApi.replyResult('123', { drawFrame: { sendToReceiveDuration } });
      expect(ws.nextSent(d => decode(d as Uint8Array))).toMatchObject({
        sentAtTime: expect.anything(),
      });
    });
  });

  describe(StreamApi.prototype.replyError, () => {
    it('sends error on the websocket', () => {
      streamApi.replyError('123', {});
      expect(ws.nextSent(d => decode(d as Uint8Array))).toMatchObject({
        sentAtTime: expect.anything(),
      });
    });
  });

  describe(StreamApi.prototype.onRequest, () => {
    beforeEach(() => streamApi.connect(descriptor));

    it('invokes callback when request is received', () => {
      const handler = jest.fn();
      streamApi.onRequest(handler);
      ws.receiveMessage(
        vertexvis.protobuf.stream.StreamMessage.encode({
          sentAtTime: { seconds: 0, nanos: 0 },
          request: { drawFrame: {} },
        }).finish()
      );
      expect(handler).toHaveBeenCalled();
    });
  });
});

function mockRequestId(): string {
  const requestId = (Math.random() * 100000).toString();
  (UUID.create as jest.Mock).mockReturnValueOnce(requestId);
  return requestId;
}
