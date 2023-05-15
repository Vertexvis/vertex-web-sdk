import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Objects, UUID } from '@vertexvis/utils';

import { currentDateAsProtoTimestamp } from '../../time';
import {
  DrawFramePayload,
  GracefulReconnectPayload,
  RequestMessage,
} from '../../types';

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

type GracefulReconnectRequest = RequestId &
  Payload<vertexvis.protobuf.stream.IGracefulReconnectionPayload>;

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
      visibleBoundingBox: {
        xmin: -1,
        ymin: -1,
        zmin: -1,
        xmax: 1,
        ymax: 1,
        zmax: 1,
      },
      crossSectioning: {
        sectionPlanes: [],
      },
      displayListSummary: {
        visibleSummary: {
          count: 100,
        },
        selectedVisibleSummary: {
          count: 0,
        },
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

export function gracefulReconnect(
  req: GracefulReconnectRequest = {},
  meta?: Metadata
): RequestMessage {
  const def: GracefulReconnectPayload = {
    streamId: { hex: UUID.create() },
    timeToReconnectDuration: { seconds: 1, nanos: 0 },
  };
  return request(
    {
      requestId: req.requestId,
      payload: { gracefulReconnection: Objects.defaults(req.payload, def) },
    },
    meta
  );
}
