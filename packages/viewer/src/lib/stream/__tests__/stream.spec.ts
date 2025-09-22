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
import { ViewerStream } from '../stream';

describe(ViewerStream, () => {
  const clientId = random.string({ alpha: true });
  const deviceId = random.string({ alpha: true });
  const config = parseConfig('platdev');
  const dimensions = Dimensions.create(100, 50);
  const streamAttributes = {};
  const frameBgColor = Color.create(255, 255, 255);

  const urn123 = 'urn:vertex:stream-key:123';
  const urn234 = 'urn:vertex:stream-key:234';
  const urnMalformed = 'urn:vertex:invalid-type:234';

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

      stream.load(urn123, clientId, deviceId, config);
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
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await expect(connected123).resolves.toBeDefined();

      const closeWs = jest.spyOn(ws, 'close');
      const connected234 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '234'
      );
      stream.load(urn234, clientId, deviceId, config);
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
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await expect(connected123).resolves.toBeDefined();

      const closeWs = jest.spyOn(ws, 'close');
      const connectedSvs = stream.stateChanged.onceWhen(
        (s) =>
          s.type === 'connected' &&
          s.resource.resource.id === '123' &&
          s.resource.subResource?.id === 'svs'
      );
      stream.load(`${urn123}?scene-view-state=svs`, clientId, deviceId, config);

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
      stream.load(urn123, clientId, deviceId, config);

      stream.load(urn234, clientId, deviceId, config);
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
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;

      ws.receiveMessage(encode(Fixtures.Requests.gracefulReconnect()));

      stream.load(urn234, clientId, deviceId, config);
      expect(closeWs).toHaveBeenCalled();

      await simulateFrame(ws);
      await expect(connected234).resolves.toBeDefined();
    });

    it('connects with device id', async () => {
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

      stream.load(urn123, clientId, deviceId, config);
      await connecting;
      await simulateFrame(ws);
      await stream.stateChanged.onceWhen((s) => s.type === 'connected');

      expect(connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(deviceId),
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
      let load = stream.load(urnMalformed, clientId, deviceId, config);
      await expect(load).rejects.toThrowError(InvalidResourceUrnError);
      await expect(failure).resolves.toBeDefined();

      connect.mockRejectedValue(new Error('WS connection failed'));
      failure = stream.stateChanged.onceWhen(
        (s) => s.type === 'connection-failed'
      );
      load = stream.load(urn123, clientId, deviceId, config);
      await expect(load).rejects.toThrowError(WebsocketConnectionError);
      await expect(failure).resolves.toBeDefined();
      connect.mockRestore();

      startStream.mockRejectedValue(
        new StreamRequestError('123', {}, 'Request failed', '')
      );
      load = stream.load(urn123, clientId, deviceId, config);
      await expect(load).rejects.toThrowError(StreamRequestError);
      await expect(failure).resolves.toBeDefined();
      startStream.mockRestore();
    });

    it('always requests at least a 1x1 image', async () => {
      const { stream, ws } = makeStreamBase();

      const startSpy = jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const connecting = stream.stateChanged.onceWhen(
        (s) => s.type === 'connecting' && s.resource.resource.id === '123'
      );

      stream.load(urn123, clientId, deviceId, config);
      await expect(connecting).resolves.toBeDefined();

      await simulateFrame(ws);
      const connected = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected'
      );
      await expect(connected).resolves.toBeDefined();

      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: expect.objectContaining({
            width: 1,
            height: 1,
          }),
        })
      );
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
      stream.load(urn123, clientId, deviceId, config);
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
      stream.load(urn123, clientId, deviceId, config);
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
      stream.load(urn123, clientId, deviceId, config);
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
      stream.load(urn123, clientId, deviceId, config);
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

    it('always requests at least a 1x1 image', async () => {
      const { stream, ws } = makeStreamBase();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      const reconnectSpy = jest
        .spyOn(stream, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const closeWs = jest.spyOn(ws, 'close');

      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;

      const reconnected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      ws.receiveMessage(encode(Fixtures.Requests.gracefulReconnect()));

      expect(closeWs).toHaveBeenCalled();
      await expect(reconnected123).resolves.toBeDefined();

      expect(reconnectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: expect.objectContaining({
            width: 1,
            height: 1,
          }),
        })
      );
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
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;

      await Async.delay(expiryInMs * 2);
      expect(refreshToken).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates stream attributes if defined', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const updateStream = jest.spyOn(stream, 'updateStream');
      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;

      stream.update({});
      expect(updateStream).not.toBeCalled();

      stream.update({ streamAttributes: { depthBuffers: 'final' } });
      expect(updateStream).toHaveBeenCalled();
    });

    it('does not update stream attributes if equal', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const updateStream = jest.spyOn(stream, 'updateStream');
      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;

      stream.update({ streamAttributes: { featureLines: { width: 1 } } });
      expect(updateStream).toHaveBeenCalled();
      updateStream.mockClear();

      stream.update({ streamAttributes: { featureLines: { width: 1 } } });
      expect(updateStream).not.toHaveBeenCalled();
    });

    it('updates dimensions if defined', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const updateDimensions = jest.spyOn(stream, 'updateDimensions');
      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;

      stream.update({});
      expect(updateDimensions).not.toBeCalled();

      stream.update({ dimensions: Dimensions.create(100, 100) });
      expect(updateDimensions).toHaveBeenCalled();
    });

    it('does not update dimensions if equal', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const updateDimensions = jest.spyOn(stream, 'updateDimensions');
      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;

      stream.update({ dimensions: Dimensions.create(100, 100) });
      expect(updateDimensions).toHaveBeenCalled();
      updateDimensions.mockClear();

      stream.update({ dimensions: Dimensions.create(100, 100) });
      expect(updateDimensions).not.toHaveBeenCalled();
    });

    it('always request at least a 1x1 image', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const updateDimensions = jest.spyOn(stream, 'updateDimensions');
      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;

      stream.update({});
      expect(updateDimensions).not.toBeCalled();

      stream.update({ dimensions: Dimensions.create(0, 0) });

      expect(updateDimensions).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: {
            width: 1,
            height: 1,
          },
        })
      );
    });
  });

  describe('pause', () => {
    it('closes an open connection and captures state', async () => {
      const { stream, ws } = makeStream();

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);

      const close = jest.spyOn(ws, 'close');
      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;
      stream.pause();

      expect(close).toHaveBeenCalled();
      expect(stream.isPaused()).toBe(true);
    });
  });

  describe('resume', () => {
    it('reconnects to a paused stream', async () => {
      const { stream, ws } = makeStream();
      const attributes = {
        streamAttributes: { featureLines: { width: 1, color: '#ff0000' } },
      };

      jest
        .spyOn(stream, 'startStream')
        .mockResolvedValue(Fixtures.Responses.startStream().response);
      jest
        .spyOn(stream, 'syncTime')
        .mockResolvedValue(Fixtures.Responses.syncTime().response);
      const reconnectSpy = jest
        .spyOn(stream, 'reconnect')
        .mockResolvedValue(Fixtures.Responses.reconnect().response);

      const connected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.load(urn123, clientId, deviceId, config);
      await simulateFrame(ws);
      await connected123;
      stream.update(attributes);
      stream.pause();

      const reconnected123 = stream.stateChanged.onceWhen(
        (s) => s.type === 'connected' && s.resource.resource.id === '123'
      );
      stream.resume();
      await reconnected123;
      expect(reconnectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            featureLines: expect.objectContaining({
              lineWidth: 1,
              lineColor: {
                r: 255,
                g: 0,
                b: 0,
              },
            }),
          }),
        })
      );
    });
  });

  function makeStream(): { stream: ViewerStream; ws: WebSocketClientMock } {
    const { stream, ws } = makeStreamBase();
    stream.update({ dimensions, streamAttributes, frameBgColor });

    return { stream, ws };
  }

  function makeStreamBase(): { stream: ViewerStream; ws: WebSocketClientMock } {
    const ws = new WebSocketClientMock();
    const stream = new ViewerStream(ws, {
      tokenRefreshOffsetInSeconds: 0,
      offlineThresholdInSeconds: offlineReconnectThresholdInMs / 1000,
    });

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
