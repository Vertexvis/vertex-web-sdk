import { Async, UUID } from '@vertexvis/utils';
import { FrameCamera, Frame } from '../types';
import { StreamApi, protoToDate } from '@vertexvis/stream-api';
import { ifDrawFrame } from './utils';
import { FrameRenderer } from './renderer';

const DEFAULT_TIMEOUT_IN_MS = 10 * 1000; // 10 seconds

export interface FrameRequest {
  correlationId?: string;
  camera: FrameCamera.FrameCamera;
  timeoutInMs?: number;
}

export interface FrameResponse {
  id: string | undefined;
  sentAt: Date;
  frame: Frame.Frame;
}

let count = 0;
let recievedCount = 0;

export type RemoteRenderer = FrameRenderer<FrameRequest, FrameResponse>;

function requestFrame(api: StreamApi): RemoteRenderer {
  const requests = new Map<string, (resp: FrameResponse) => void>();

  api.onRequest(
    ifDrawFrame(frame => msg => {
      const resp = {
        id:
          msg.request.requestId?.value != null
            ? msg.request.requestId.value
            : undefined,
        sentAt: protoToDate({
          seconds: msg.sentAtTime.seconds || 0,
          nanos: msg.sentAtTime.nanos || 0,
        }),
        frame: Frame.fromProto(frame),
      };
      if (frame.frameCorrelationIds) {
        recievedCount++;
        console.log('sent: ', count, 'recieved: ', recievedCount);
        frame.frameCorrelationIds.forEach(id => {
          const callback = requests.get(id);
          if (callback != null) {
            callback(resp);
          }
        });
      }
    })
  );

  return req => {
    const corrId = req.correlationId || UUID.create();
    const timeout = req.timeoutInMs || DEFAULT_TIMEOUT_IN_MS;
    const update = new Promise<FrameResponse>(resolve => {
      requests.set(corrId, resolve);
      count++;
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

/**
 * Returns a new `FrameRenderer` that issues requests to render a frame through
 * our streaming client API.
 *
 * @param api The API client to request frames through.
 */
export function createStreamApiRenderer(api: StreamApi): RemoteRenderer {
  return requestFrame(api);
}
