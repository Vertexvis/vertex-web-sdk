import { Async, UUID } from '@vertexvis/utils';
import { Animation, FlyTo, FrameCamera } from '../types';
import { StreamApi, protoToDate } from '@vertexvis/stream-api';
import { ifDrawFrame } from './utils';
import { FrameRenderer } from './renderer';
import { buildFlyToOperation } from '../commands/streamCommandsMapper';

const DEFAULT_TIMEOUT_IN_MS = 10 * 1000; // 10 seconds

export interface FrameRequest {
  correlationId?: string;
  camera: FrameCamera.FrameCamera;
  timeoutInMs?: number;
  flyToOptions?: FlyTo.FlyToOptions;
  animation?: Animation.Animation;
}

export interface FrameResponse {
  id: string | undefined;
  sentAt: Date;
}

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
      };

      if (frame.frameCorrelationIds) {
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
    if (req.flyToOptions) {
      const payload = buildFlyToOperation(
        corrId,
        req.flyToOptions,
        req.animation
      );
      const update = new Promise<FrameResponse>(resolve => {
        requests.set(corrId, resolve);
        api.flyTo(payload, false);
      });

      return Async.timeout(timeout, update).finally(() =>
        requests.delete(corrId)
      );
    } else {
      const update = new Promise<FrameResponse>(resolve => {
        requests.set(corrId, resolve);
        api.replaceCamera(
          {
            camera: req.camera,
            frameCorrelationId: { value: corrId },
          },
          false
        );
      });

      return Async.timeout(timeout, update).finally(() =>
        requests.delete(corrId)
      );
    }
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
