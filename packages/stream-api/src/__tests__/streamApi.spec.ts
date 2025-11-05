jest.mock('@vertexvis/utils', () => {
  const utils = jest.requireActual('@vertexvis/utils');
  return {
    ...utils,
    UUID: { create: jest.fn() },
  };
});

import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { UUID } from '@vertexvis/utils';

import { decode } from '../encoder';
import { StreamApi } from '../streamApi';
import { WebSocketClientMock } from '../testing';
import { currentDateAsProtoTimestamp, toProtoDuration } from '../time';

describe(StreamApi, () => {
  const ws = new WebSocketClientMock();
  const streamApi = new StreamApi(ws, { loggingEnabled: false });
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
      await streamApi.beginInteraction(undefined, false);
      expect(send).toHaveBeenCalled();
    });

    it('includes sent at time for requests with responses', async () => {
      const requestId = mockRequestId();
      const request = streamApi.endInteraction(undefined, true);
      ws.receiveMessage(
        vertexvis.protobuf.stream.StreamMessage.encode({
          sentAtTime: { seconds: 0, nanos: 0 },
          response: { requestId: { value: requestId }, endInteraction: {} },
        }).finish()
      );
      await request;
      expect(ws.nextSent((d) => decode(d as Uint8Array))).toMatchObject({
        sentAtTime: expect.anything(),
      });
    });

    it('includes sent at time for requests without responses', () => {
      streamApi.syncTime({ requestTime: currentDateAsProtoTimestamp() }, false);
      expect(ws.nextSent((d) => decode(d as Uint8Array))).toMatchObject({
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
      expect(ws.nextSent((d) => decode(d as Uint8Array))).toMatchObject({
        sentAtTime: expect.anything(),
      });
    });
  });

  describe(StreamApi.prototype.replyError, () => {
    it('sends error on the websocket', () => {
      streamApi.replyError('123', {});
      expect(ws.nextSent((d) => decode(d as Uint8Array))).toMatchObject({
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

  describe('replaceCamera', () => {
    it('sends the request for a valid camera', () => {
      streamApi.replaceCamera(
        {
          camera: {
            perspective: {
              lookAt: {
                x: 1,
                y: 2,
                z: 3,
              },
              position: {
                x: 1,
                y: 2,
                z: 3,
              },
              up: {
                x: 1,
                y: 2,
                z: 3,
              },
            },
          },
        },
        true
      );

      expect(send).toHaveBeenCalled();
    });

    it('does not send the request for an invalid camera', () => {
      streamApi.replaceCamera(
        {
          camera: {
            perspective: {
              lookAt: {
                x: Infinity,
                y: 2,
                z: 3,
              },
              position: {
                x: 1,
                y: 2,
                z: 3,
              },
              up: {
                x: 1,
                y: 2,
                z: 3,
              },
            },
          },
        },
        true
      );

      expect(send).not.toHaveBeenCalled();
    });
  });

  describe('flyTo', () => {
    it('sends the request for a valid bounding box', () => {
      streamApi.flyTo(
        {
          boundingBox: {
            xmax: 5,
            ymax: 5,
            zmax: 5,
            xmin: 1,
            ymin: 1,
            zmin: 1,
          },
        },
        true
      );

      expect(send).toHaveBeenCalled();
    });

    it('does not send the request for an invalid bounding box', () => {
      streamApi.flyTo(
        {
          boundingBox: {
            xmax: Infinity,
            ymax: 5,
            zmax: 5,
            xmin: 1,
            ymin: 1,
            zmin: 1,
          },
        },
        true
      );

      expect(send).not.toHaveBeenCalled();
    });

    it('sends the request for a valid camera', () => {
      streamApi.flyTo(
        {
          camera: {
            perspective: {
              lookAt: {
                x: 1,
                y: 2,
                z: 3,
              },
              position: {
                x: 1,
                y: 2,
                z: 3,
              },
              up: {
                x: 1,
                y: 2,
                z: 3,
              },
            },
          },
        },
        true
      );

      expect(send).toHaveBeenCalled();
    });

    it('does not send the request for an invalid camera', () => {
      streamApi.flyTo(
        {
          camera: {
            perspective: {
              lookAt: {
                x: Infinity,
                y: 2,
                z: 3,
              },
              position: {
                x: 1,
                y: 2,
                z: 3,
              },
              up: {
                x: 1,
                y: 2,
                z: 3,
              },
            },
          },
        },
        true
      );

      expect(send).not.toHaveBeenCalled();
    });
  });

  it('sends the request for a valid base camera', () => {
    streamApi.flyTo(
      {
        baseCamera: {
          perspective: {
            lookAt: {
              x: 1,
              y: 2,
              z: 3,
            },
            position: {
              x: 1,
              y: 2,
              z: 3,
            },
            up: {
              x: 1,
              y: 2,
              z: 3,
            },
          },
        },
      },
      true
    );

    expect(send).toHaveBeenCalled();
  });

  it('does not send the request for an invalid base camera', () => {
    streamApi.flyTo(
      {
        baseCamera: {
          perspective: {
            lookAt: {
              x: Infinity,
              y: 2,
              z: 3,
            },
            position: {
              x: 1,
              y: 2,
              z: 3,
            },
            up: {
              x: 1,
              y: 2,
              z: 3,
            },
          },
        },
      },
      true
    );

    expect(send).not.toHaveBeenCalled();
  });

  describe('updateDimensions', () => {
    it('sends the request for valid dimensions', () => {
      streamApi.updateDimensions(
        {
          dimensions: {
            height: 5,
            width: 5,
          },
        },
        true
      );

      expect(send).toHaveBeenCalled();
    });

    it('does not send the request for invalid dimensions', () => {
      streamApi.updateDimensions(
        {
          dimensions: {
            height: 5,
            width: NaN,
          },
        },
        true
      );

      expect(send).not.toHaveBeenCalled();
    });
  });

  describe('hitItems', () => {
    it('sends the request for a valid point', () => {
      streamApi.hitItems(
        {
          point: {
            x: 5,
            y: 5,
          },
        },
        true
      );

      expect(send).toHaveBeenCalled();
    });

    it('does not send the request for an invalid point', () => {
      streamApi.hitItems(
        {
          point: {
            x: 5,
            y: NaN,
          },
        },
        true
      );

      expect(send).not.toHaveBeenCalled();
    });
  });

  describe('updateCrossSectioning', () => {
    it('sends the request for a valid normal and offset', () => {
      streamApi.updateCrossSectioning(
        {
          crossSectioning: {
            sectionPlanes: [
              {
                normal: {
                  x: 1,
                  y: 2,
                  z: 3,
                },
                offset: 4,
              },
            ],
          },
        },
        true
      );

      expect(send).toHaveBeenCalled();
    });

    it('does not send the request for an invalid normal', () => {
      streamApi.updateCrossSectioning(
        {
          crossSectioning: {
            sectionPlanes: [
              {
                normal: {
                  x: Infinity,
                  y: 2,
                  z: 3,
                },
                offset: 4,
              },
            ],
          },
        },
        true
      );

      expect(send).not.toHaveBeenCalled();
    });

    it('does not send the request for an invalid offset', () => {
      streamApi.updateCrossSectioning(
        {
          crossSectioning: {
            sectionPlanes: [
              {
                normal: {
                  x: 1,
                  y: 2,
                  z: 3,
                },
                offset: NaN,
              },
            ],
          },
        },
        true
      );

      expect(send).not.toHaveBeenCalled();
    });
  });
});

function mockRequestId(): string {
  const requestId = (Math.random() * 100000).toString();
  (UUID.create as jest.Mock).mockReturnValueOnce(requestId);
  return requestId;
}
