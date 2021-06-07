import { RequestMessageHandler } from '@vertexvis/stream-api';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

export function ifRequestId(
  f: (id: string) => RequestMessageHandler
): RequestMessageHandler {
  return (req) => {
    const reqId = req.request.requestId?.value;
    if (reqId != null) {
      f(reqId)(req);
    }
  };
}

export function ifDrawFrame(
  f: (
    frame: vertexvis.protobuf.stream.IDrawFramePayload
  ) => RequestMessageHandler
): RequestMessageHandler {
  return (req) => {
    const { drawFrame } = req.request;

    if (drawFrame != null) {
      f(drawFrame)(req);
    }
  };
}
