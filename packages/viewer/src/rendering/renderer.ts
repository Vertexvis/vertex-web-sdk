import { Async, UUID } from '@vertexvis/utils';
import { FrameCamera, Frame } from '../types';
import { StreamApi, protoToDate } from '@vertexvis/stream-api';
import { ifDrawFrame } from './utils';

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

/**
 * An asynchronous function that generates a frame from a request object.
 */
export type FrameRenderer = (req: FrameRequest) => Promise<FrameResponse>;

function requestFrame(api: StreamApi): FrameRenderer {
  const requests = new Map<string, (resp: FrameResponse) => void>();

  api.onRequest(
    ifDrawFrame(frame => msg => {
      const resp = {
        id: msg.request.requestId?.value,
        sentAt: protoToDate({
          seconds: msg.sentAtTime.seconds || 0,
          nanos: msg.sentAtTime.nanos || 0,
        }),
        frame: Frame.fromProto(frame),
      };

      frame.frameCorrelationIds.forEach(id => {
        const callback = requests.get(id);
        if (callback != null) {
          callback(resp);
        }
      });
    })
  );

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

/**
 * Returns a new `FrameRenderer` that issues requests to render a frame through
 * our streaming client API.
 *
 * @param api The API client to request frames through.
 */
export function createStreamApiRenderer(api: StreamApi): FrameRenderer {
  return requestFrame(api);
}
