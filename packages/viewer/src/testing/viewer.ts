import { vertexvis } from '@vertexvis/frame-streaming-protos';
import {
  encode,
  Fixtures as StreamFixtures,
  WebSocketClientMock,
} from '@vertexvis/stream-api';
import { Async } from '@vertexvis/utils';

import { ViewerStream } from '../lib/stream/stream';
import * as Fixtures from './fixtures';
import { random } from './random';

interface ViewerStreamOperationCtx {
  stream: ViewerStream;
  ws: WebSocketClientMock;
  viewer: HTMLVertexViewerElement;
}

interface LoadViewerStreamKeyOptions {
  token?: string;
  beforeConnected?: VoidFunction;
}

export const key1 = 'urn:vertex:stream-key:123';

export const key2 = 'urn:vertex:stream-key:234';

export function makeViewerStream(): {
  stream: ViewerStream;
  ws: WebSocketClientMock;
} {
  const ws = new WebSocketClientMock();
  const stream = new ViewerStream(ws);
  return { stream, ws };
}

export async function loadViewerStreamKey(
  urn: string,
  { viewer, stream, ws }: ViewerStreamOperationCtx,
  {
    token = random.string({ alpha: true }),
    beforeConnected,
  }: LoadViewerStreamKeyOptions = {}
): Promise<void> {
  jest.spyOn(stream, 'startStream').mockResolvedValue(
    StreamFixtures.Responses.startStream({
      result: {
        token: {
          token: token,
          expiresIn: new Date().getTime() + 10000,
        },
      },
    }).response
  );
  jest
    .spyOn(stream, 'syncTime')
    .mockResolvedValue(StreamFixtures.Responses.syncTime().response);

  const connecting = stream.stateChanged.onceWhen(
    (s) => s.type === 'connecting'
  );
  const loaded = viewer.load(urn);

  // Emit frame drawn on next event loop
  await connecting;
  await Async.delay(10);
  beforeConnected?.();
  ws.receiveMessage(
    encode(
      StreamFixtures.Requests.drawFrame({
        payload: Fixtures.drawFramePayloadPerspective,
      })
    )
  );
  await loaded;
}

interface GracefulReconnectOptions<T = void> {
  beforeReconnect?: () => Promise<T>;
}

export async function gracefulReconnect<T = void>(
  { viewer, stream, ws }: ViewerStreamOperationCtx,
  { beforeReconnect }: GracefulReconnectOptions<T> = {}
): Promise<T | undefined> {
  jest
    .spyOn(stream, 'reconnect')
    .mockResolvedValue(StreamFixtures.Responses.reconnect().response);
  jest
    .spyOn(stream, 'syncTime')
    .mockResolvedValue(StreamFixtures.Responses.syncTime().response);

  const connecting = stream.stateChanged.onceWhen(
    (s) => s.type === 'reconnecting'
  );

  ws.receiveMessage(encode(StreamFixtures.Requests.gracefulReconnect()));
  const result = await beforeReconnect?.();

  await connecting;
  await Async.delay(10);

  ws.receiveMessage(
    encode(
      StreamFixtures.Requests.drawFrame({
        payload: Fixtures.drawFramePayloadPerspective,
      })
    )
  );

  return result;
}

export function receiveFrame(
  ws: WebSocketClientMock,
  transformPayload?: (
    payload: vertexvis.protobuf.stream.IDrawFramePayload
  ) => vertexvis.protobuf.stream.IDrawFramePayload
): void {
  ws.receiveMessage(
    encode(
      StreamFixtures.Requests.drawFrame({
        payload: transformPayload?.(Fixtures.drawFramePayloadPerspective),
      })
    )
  );
}
