import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Objects, UUID } from '@vertexvis/utils';
import { RefreshTokenResult } from '../..';
import { currentDateAsProtoTimestamp } from '../../time';
import {
  ResponseMessage,
  ReconnectResult,
  StartStreamResult,
  SyncTimeResult,
  LoadSceneViewStateResult,
} from '../../types';

type Metadata = Partial<Pick<ResponseMessage, 'sentAtTime'>>;

interface RequestId {
  requestId?: string;
}

interface Result<T> {
  result?: T;
}

type Response = RequestId &
  Result<Omit<vertexvis.protobuf.stream.IStreamResponse, 'requestId'>>;

type StartStreamResponse = RequestId &
  Result<vertexvis.protobuf.stream.IStartStreamResult>;

type SyncTimeResponse = RequestId &
  Result<vertexvis.protobuf.stream.ISyncTimeResult>;

type ReconnectResponse = RequestId &
  Result<vertexvis.protobuf.stream.IReconnectResult>;

type LoadSceneViewStateResponse = RequestId &
  Result<vertexvis.protobuf.stream.ILoadSceneViewStateResult>;

type RefreshTokenResponse = RequestId &
  Result<vertexvis.protobuf.stream.IRefreshTokenResult>;

function response(res: Response, meta?: Metadata): ResponseMessage {
  return {
    sentAtTime: currentDateAsProtoTimestamp(),
    ...meta,
    response: {
      requestId: res.requestId != null ? { value: res.requestId } : undefined,
      ...res.result,
    },
  };
}

export function startStream(
  res: StartStreamResponse = {},
  meta?: Metadata
): ResponseMessage {
  const def: StartStreamResult = {
    streamId: { hex: UUID.create() },
    sceneViewId: { hex: UUID.create() },
    sessionId: { hex: UUID.create() },
    jwt: 'jwt',
    token: { token: 'token', expiresIn: new Date().getTime() + 10000 },
    worldOrientation: {
      front: { x: 0, y: 0, z: 1 },
      up: { x: 0, y: 1, z: 0 },
    },
  };
  return response(
    {
      requestId: res.requestId,
      result: { startStream: Objects.defaults(res.result, def) },
    },
    meta
  );
}

export function syncTime(
  res: SyncTimeResponse = {},
  meta?: Metadata
): ResponseMessage {
  const def: SyncTimeResult = { replyTime: { seconds: 1, nanos: 0 } };
  return response({
    requestId: res.requestId,
    result: { syncTime: Objects.defaults(res.result, def) },
  });
}

export function reconnect(
  res: ReconnectResponse = {},
  meta?: Metadata
): ResponseMessage {
  const def: ReconnectResult = {
    jwt: 'jwt',
    token: { token: 'token', expiresIn: new Date().getTime() + 10000 },
  };
  return response(
    {
      requestId: res.requestId,
      result: { reconnect: Objects.defaults(res.result, def) },
    },
    meta
  );
}

export function loadSceneViewState(
  res: LoadSceneViewStateResponse = {},
  meta?: Metadata
): ResponseMessage {
  const def: LoadSceneViewStateResult = {};
  return response(
    {
      requestId: res.requestId,
      result: { loadSceneViewState: Objects.defaults(res.result, def) },
    },
    meta
  );
}

export function refreshToken(
  res: RefreshTokenResponse = {},
  meta?: Metadata
): ResponseMessage {
  const def: RefreshTokenResult = {
    token: { token: 'token', expiresIn: new Date().getTime() + 10000 },
  };
  return response(
    {
      requestId: res.requestId,
      result: { refreshToken: Objects.defaults(res.result, def) },
    },
    meta
  );
}
