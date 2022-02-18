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

interface LoadViewerStreamKeyCtx {
  stream: ViewerStream;
  ws: WebSocketClientMock;
  viewer: HTMLVertexViewerElement;
}

interface LoadViewerStreamKeyOptions {
  token?: string;
}

export const key1 = 'urn:vertexvis:stream-key:123';

export const key2 = 'urn:vertexvis:stream-key:234';

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
  { viewer, stream, ws }: LoadViewerStreamKeyCtx,
  { token = random.string({ alpha: true }) }: LoadViewerStreamKeyOptions = {}
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
  ws.receiveMessage(
    encode(
      StreamFixtures.Requests.drawFrame({ payload: Fixtures.drawFramePayload })
    )
  );
  await loaded;
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
        payload: transformPayload?.(Fixtures.drawFramePayload),
      })
    )
  );
}
