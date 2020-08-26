import { RequestMessage, DrawFramePayload } from '../../types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Objects } from '@vertexvis/utils';
import { currentDateAsProtoTimestamp } from '../../time';

type Metadata = Partial<Pick<RequestMessage, 'sentAtTime'>>;

interface RequestId {
  requestId?: string;
}

type Request = RequestId &
  Payload<Omit<vertexvis.protobuf.stream.IStreamRequest, 'requestId'>>;

interface Payload<P> {
  payload?: P;
}

type DrawFrameRequest = RequestId &
  Payload<vertexvis.protobuf.stream.IDrawFramePayload>;

function request(req: Request, meta?: Metadata): RequestMessage {
  return {
    sentAtTime: currentDateAsProtoTimestamp(),
    ...meta,
    request: {
      requestId: req.requestId != null ? { value: req.requestId } : undefined,
      ...req.payload,
    },
  };
}

export function drawFrame(
  req: DrawFrameRequest = {},
  meta?: Metadata
): RequestMessage {
  const def: DrawFramePayload = {
    sequenceNumber: 1,
    sceneAttributes: {
      camera: {
        position: { x: 0, y: 0, z: 1 },
        lookAt: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
      },
    },
    imageAttributes: {
      frameDimensions: { width: 200, height: 150 },
      imageRect: { x: 0, y: 0, width: 200, height: 150 },
      scaleFactor: 1,
    },
    frameCorrelationIds: ['123'],
    image: new Uint8Array(),
  };
  return request(
    {
      requestId: req.requestId,
      payload: { drawFrame: Objects.defaults(req.payload, def) },
    },
    meta
  );
}
