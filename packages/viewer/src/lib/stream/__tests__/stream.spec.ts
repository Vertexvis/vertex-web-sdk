import { Dimensions } from '@vertexvis/geometry';
import {
  encode,
  Fixtures,
  StreamRequestError,
  WebSocketClientMock,
} from '@vertexvis/stream-api';
import { Async, Color } from '@vertexvis/utils';
import { random } from '../../../testing';
import { parseConfig } from '../../config';
import {
  InvalidResourceUrnError,
  WebsocketConnectionError,
} from '../../errors';
import { getStorageEntry, StorageKeys } from '../../storage';
import { ViewerStream } from '../stream';

describe(ViewerStream, () => {
  const clientId = random.string({ alpha: true });
  const sessionId = random.string({ alpha: true });
  const config = parseConfig('platdev');
  const dimensions = Dimensions.create(100, 50);
  const streamAttributes = {};
  const frameBgColor = Color.create(255, 255, 255);

  const urn123 = 'urn:vertexvis:stream-key:123';
  const urn234 = 'urn:vertexvis:stream-key:234';
  const urnMalformed = 'urn:vertexvis:invalid-type:234';

  const expiryInMs = 50;
  const offlineReconnectThresholdInMs = 25;

  describe(ViewerStream.prototype.load, () => {
    it('starts stream if in disconnected state', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const connecting = stream.stateChanged.onceWhen(
        (s) => s.type === 'connecting' && s.resource.resource.id === '123'
      );

      stream.load(urn123);
      await expect(connecting).resolves.toBeDefined();

      await simulateFrame(ws);
      const connected = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected'
      );
      await expect(connected).resolves.toBeDefined();
    });

    it('starts stream if in connected state and stream key different', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await expect(connected123).resolves.toBeDefined();

      const closeWs = jest.spyOn(ws, 'close');
      const connected234 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '234'
      );
      stream.load(urn234);
      await simulateFrame(ws);

      await expect(connected234).resolves.toBeDefined();
      expect(closeWs).toHaveBeenCalled();
    });

    it('uses existing websocket if changing scene view state', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(stream, 'loadSceneViewState')
        .mockResolvedValue(Fixtures.Responses.loadSceneViewState().response);

      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await expect(connected123).resolves.toBeDefined();

      const closeWs = jest.spyOn(ws, 'close');
      const connectedSvs = stream.stateChanged.onceWhen(
        (s) =>
          s.type === 'connected' &&
          s.resource.resource.id === '123' &&
          s.resource.queries[0]?.id === 'svs'
      );
      stream.load(`${urn123}?scene-view-state=svs`);

      await expect(connectedSvs).resolves.toBeDefined();
      expect(closeWs).not.toHaveBeenCalled();
    });

    it('opens new websocket if connecting and urn changes', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const closeWs = jest.spyOn(ws, 'close');
      const connected234 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '234'
      );
      stream.load(urn123);

      stream.load(urn234);
      expect(closeWs).toHaveBeenCalled();

      await simulateFrame(ws);
      await expect(connected234).resolves.toBeDefined();
    });

    it('opens new websocket if reconnecting and urn changes', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const closeWs = jest.spyOn(ws, 'close');
      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      const connected234 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '234'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await connected123;

      ws.receiveMessage(encode(Fixtures.Requests.gracefulReconnect()));

      stream.load(urn234);
      expect(closeWs).toHaveBeenCalled();

      await simulateFrame(ws);
      await expect(connected234).resolves.toBeDefined();
    });

    it('caches session', async () => {
      const { stream, ws } = makeStream();

      const startStream = Fixtures.Responses.startStream().response;
      jest.spyOn(stream, 'startStream').mockResolvedValue(startStream);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const connecting = stream.stateChanged.onceWhen(
        (s) => s.type === 'connecting' && s.resource.resource.id === '123'
      );

      stream.load(urn123);
      await expect(connecting).resolves.toBeDefined();

      await simulateFrame(ws);
      await stream.stateChanged.onceWhen((s) => s.type === 'connected');

      const sessionId = getStorageEntry(
        StorageKeys.STREAM_SESSION,
        (records) => records[clientId]
      );
      expect(sessionId).toBe(startStream.startStream?.sessionId?.hex);
    });

    it('connects with session id', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const connect = jest.spyOn(stream, 'connect');
      const connecting = stream.stateChanged.onceWhen(
        (s) => s.type === 'connecting' && s.resource.resource.id === '123'
      );

      stream.load(urn123);
      await connecting;
      await simulateFrame(ws);
      await stream.stateChanged.onceWhen((s) => s.type === 'connected');

      expect(connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(sessionId),
        }),
        expect.anything()
      );
    });

    it('sets connection-failed state if connection fails', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const connect = jest.spyOn(ws, 'connect');
      const startStream = jest.spyOn(stream, 'startStream');

      let failure = stream.stateChanged.onceWhen(
        (s) => s.type === 'connection-failed'
      );
      let load = stream.load(urnMalformed);
      await expect(load).rejects.toThrowError(InvalidResourceUrnError);
      await expect(failure).resolves.toBeDefined();

      connect.mockRejectedValue(new Error('WS connection failed'));
      failure = stream.stateChanged.onceWhen(
        (s) => s.type === 'connection-failed'
      );
      load = stream.load(urn123);
      await expect(load).rejects.toThrowError(WebsocketConnectionError);
      await expect(failure).resolves.toBeDefined();
      connect.mockRestore();

      startStream.mockRejectedValue(
        new StreamRequestError('123', {}, 'Request failed', '')
      );
      load = stream.load(urn123);
      await expect(load).rejects.toThrowError(StreamRequestError);
      await expect(failure).resolves.toBeDefined();
      startStream.mockRestore();
    });
  });

  describe('reconnect', () => {
    it('reconnects websocket if requested', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(stream, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const closeWs = jest.spyOn(ws, 'close');

      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await connected123;

      const reconnected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      ws.receiveMessage(encode(Fixtures.Requests.gracefulReconnect()));

      expect(closeWs).toHaveBeenCalled();
      await expect(reconnected123).resolves.toBeDefined();
    });

    it('reconnects websocket if websocket disconnected', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(stream, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const connected = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await connected;

      const reconnecting = stream.stateChanged.onceWhen(
        (s) => s.type === 'reconnecting'
      );
      const reconnected = stream.stateChanged.onceWhen((s) => {
        return s.type === 'connected' && s.resource.resource.id === '123';
      });
      ws.close();

      await expect(reconnecting).resolves.toBeDefined();
      await expect(reconnected).resolves.toBeDefined();
    });

    it('attempts reconnect after host goes offline', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(stream, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const connected = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await connected;

      const reconnected = stream.stateChanged.onceWhen((s) => {
        return s.type === 'connected' && s.resource.resource.id === '123';
      });

      window.dispatchEvent(new Event('offline'));

      await expect(reconnected).resolves.toBeDefined();
    });

    it('does not attempt reconnect if host toggles between offline/online within threshold', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(stream, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const connected = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await connected;

      const reconnected = Async.timeout(
        offlineReconnectThresholdInMs * 2,
        stream.stateChanged.onceWhen((s) => {
          return s.type === 'connected' && s.resource.resource.id === '123';
        })
      )
        .then(() => true)
        .catch(() => false);

      window.dispatchEvent(new Event('offline'));
      await Async.delay(offlineReconnectThresholdInMs / 2);
      window.dispatchEvent(new Event('online'));

      await expect(reconnected).resolves.toBe(false);
    });
  });

  describe('refresh token', () => {
    it('refreshes token when about to expire', async () => {
      const { stream, ws } = makeStream();

      jest.spyOn(stream, 'startStream').mockResolvedValue(
        Fixtures.Responses.startStream({
          result: {
            token: { token: random.string(), expiresIn: expiryInMs / 1000 },
          },
        }).response
      );
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(stream, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const refreshToken = jest.spyOn(stream, 'refreshToken');
      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await connected123;

      await Async.delay(expiryInMs * 2);
      expect(refreshToken).toHaveBeenCalled();
    });
  });

  function makeStream(): {
    stream: ViewerStream;
    ws: WebSocketClientMock;
  } {
    const ws = new WebSocketClientMock();
    const stream = new ViewerStream(
      ws,
      () => clientId,
      () => sessionId,
      () => config,
      () => dimensions,
      () => streamAttributes,
      () => frameBgColor,
      {
        tokenRefreshOffsetInSeconds: 0,
        offlineThresholdInSeconds: offlineReconnectThresholdInMs / 1000,
      }
    );

    return { stream, ws };
  }

  async function simulateFrame(
    ws: WebSocketClientMock,
    latency = 10
  ): Promise<void> {
    await Async.delay(latency);
    ws.receiveMessage(encode(Fixtures.Requests.drawFrame()));
  }
});
