import { UUID } from '@vertexvis/utils';
import { FrameCamera, Frame } from '../types';
import { StreamApi, protoToDate } from '@vertexvis/stream-api';
import { ifDrawFrame } from './utils';
import { FrameRenderer } from './renderer';

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
    const update = new Promise<FrameResponse>(resolve => {
      requests.set(corrId, resolve);

      api.replaceCamera(
        { camera: req.camera, frameCorrelationId: { value: corrId } },
        false
      );
    });

    return update.finally(() => {
      requests.delete(corrId);
    });
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
