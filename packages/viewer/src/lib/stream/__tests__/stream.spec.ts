import { Dimensions } from '@vertexvis/geometry';
import {
  encode,
  Fixtures,
  StreamApi,
  StreamAttributes,
  WebSocketClientMock,
} from '@vertexvis/stream-api';
import { Async, Color } from '@vertexvis/utils';
import { random } from '../../../testing';
import { Config, parseConfig } from '../../config';
import { FrameStream } from '../stream';

describe(FrameStream, () => {
  const clientId = (): string => random.string();
  const sessionId = (): string => random.string();
  const config = (): Config => parseConfig('platdev');
  const dimensions = (): Dimensions.Dimensions => Dimensions.create(100, 50);
  const streamAttributes = (): StreamAttributes => ({});
  const frameBgColor = (): Color.Color => Color.create(255, 255, 255);

  const urn123 = 'urn:vertexvis:stream-key:123';
  const urn234 = 'urn:vertexvis:stream-key:234';

  const expiryInMs = 50;

  describe(FrameStream.prototype.load, () => {
    it('starts stream if in disconnected state', async () => {
      const { stream, streamApi, ws } = makeStream();

      jest
        .spyOn(streamApi, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(streamApi, 'syncTime')
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
      const { stream, streamApi, ws } = makeStream();

      jest
        .spyOn(streamApi, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(streamApi, 'syncTime')
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
      const { stream, streamApi, ws } = makeStream();

      jest
        .spyOn(streamApi, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(streamApi, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(streamApi, 'loadSceneViewState')
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
      const { stream, streamApi, ws } = makeStream();

      jest
        .spyOn(streamApi, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(streamApi, 'syncTime')
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
      const { stream, streamApi, ws } = makeStream();

      jest
        .spyOn(streamApi, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(streamApi, 'syncTime')
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
  });

  describe('reconnect', () => {
    it('reconnects websocket if requested', async () => {
      const { stream, streamApi, ws } = makeStream();

      jest
        .spyOn(streamApi, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(streamApi, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(streamApi, 'reconnect')
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
      const { stream, streamApi, ws } = makeStream();

      jest
        .spyOn(streamApi, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(streamApi, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(streamApi, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123);
      await simulateFrame(ws);
      await connected123;

      const reconnecting123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'reconnecting'
      );
      const reconnected123 = stream.stateChanged.onceWhen((s) => {
        return s.type === 'connected' && s.resource.resource.id === '123';
      });
      ws.close();

      await expect(reconnecting123).resolves.toBeDefined();
      await expect(reconnected123).resolves.toBeDefined();
    });
  });

  describe('refresh token', () => {
    it('refreshes token when about to expire', async () => {
      const { stream, streamApi, ws } = makeStream();

      jest.spyOn(streamApi, 'startStream').mockResolvedValue(
        Fixtures.Responses.startStream({
          result: {
            token: { token: random.string(), expiresIn: expiryInMs / 1000 },
          },
        }).response
      );
      jest
        .spyOn(streamApi, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      jest
        .spyOn(streamApi, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const refreshToken = jest.spyOn(streamApi, 'refreshToken');
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
    streamApi: StreamApi;
    stream: FrameStream;
    ws: WebSocketClientMock;
  } {
    const ws = new WebSocketClientMock();
    const streamApi = new StreamApi(ws);
    const stream = new FrameStream(
      streamApi,
      clientId,
      sessionId,
      config,
      dimensions,
      streamAttributes,
      frameBgColor,
      { tokenRefreshOffsetInSeconds: 0 }
    );

    return { stream, streamApi, ws };
  }

  async function simulateFrame(
    ws: WebSocketClientMock,
    latency = 10
  ): Promise<void> {
    await Async.delay(latency);
    ws.receiveMessage(encode(Fixtures.Requests.drawFrame()));
  }
});
