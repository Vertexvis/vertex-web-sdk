import { Async, UUID } from '@vertexvis/utils';
import { FrameCamera, Frame, SynchronizedClock } from '../types';
import { StreamApi, toProtoDuration, protoToDate } from '@vertexvis/stream-api';
import { google } from '@vertexvis/frame-streaming-protos';

const DEFAULT_TIMEOUT_IN_MS = 15 * 1000; // 15s

interface FrameRequest {
  correlationId?: string;
  camera: FrameCamera.FrameCamera;
  timeoutInMs?: number;
}

interface FrameResponse {
  id: string | undefined;
  sentAt: Date;
  frame: Frame.Frame;
}

export type Renderer = (req: FrameRequest) => Promise<FrameResponse>;

function calculateSendToReceiveDuration(
  clock: SynchronizedClock | undefined,
  response: FrameResponse
): google.protobuf.IDuration | undefined {
  if (clock != null) {
    const sentAt = clock.localTime(response.sentAt);
    const receivedAt = new Date(Date.now());
    return toProtoDuration(sentAt, receivedAt);
  }
}

function timeRender(
  api: StreamApi,
  clock: SynchronizedClock | undefined,
  renderer: Renderer
): Renderer {
  return async req => {
    const resp = await renderer(req);
    const sendToReceiveDuration = calculateSendToReceiveDuration(clock, resp);

    if (resp.id != null) {
      api.replyResult(resp.id, {
        drawFrame: {
          timing: {
            sequenceNumber: resp.frame.sequenceNumber,
            sendToReceiveDuration,
          },
        },
      });
    }

    return resp;
  };
}

function requestFrame(api: StreamApi): Renderer {
  const requests = new Map<string, (resp: FrameResponse) => void>();

  api.onRequest(msg => {
    const resp = {
      id: msg.request.requestId?.value,
      sentAt: protoToDate({
        seconds: msg.sentAtTime.seconds || 0,
        nanos: msg.sentAtTime.nanos || 0,
      }),
      frame: Frame.fromProto(msg.request.drawFrame),
    };

    msg.request.drawFrame?.frameCorrelationIds?.forEach(id => {
      const callback = requests.get(id);
      if (callback != null) {
        callback(resp);
      }
    });
  });

  return req => {
    const corrId = req.correlationId || UUID.create();
    const timeout = req.timeoutInMs || DEFAULT_TIMEOUT_IN_MS;
    const update = new Promise<FrameResponse>(resolve => {
      requests.set(corrId, resolve);

      api.replaceCamera(
        { camera: req.camera, frameCorrelationId: { value: corrId } },
        false
      );
    });

    return Async.timeout(timeout, update).finally(() =>
      requests.delete(corrId)
    );
  };
}

export function createRenderer(
  api: StreamApi,
  clock?: SynchronizedClock
): Renderer {
  return timeRender(api, clock, requestFrame(api));
}
