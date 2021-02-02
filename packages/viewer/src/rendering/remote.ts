import { Async, UUID } from '@vertexvis/utils';
import { FrameCamera, Frame, Animation } from '../types';
import { StreamApi, protoToDate } from '@vertexvis/stream-api';
import { ifDrawFrame } from './utils';
import { FrameRenderer } from './renderer';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

const DEFAULT_TIMEOUT_IN_MS = 10 * 1000; // 10 seconds

export interface FrameRequest {
  correlationId?: string;
  camera: FrameCamera.FrameCamera;
  timeoutInMs?: number;
  animation?: Animation.Animation;
}

export interface FrameResponse {
  id: string | undefined;
  sentAt: Date;
  frame: Frame.Frame;
}

export type RemoteRenderer = FrameRenderer<FrameRequest, FrameResponse>;

export const easingMap = {
  linear: vertexvis.protobuf.stream.EasingType.EASING_TYPE_LINEAR,
  'ease-out-cubic':
    vertexvis.protobuf.stream.EasingType.EASING_TYPE_EASE_OUT_CUBIC,
  'ease-out-quad':
    vertexvis.protobuf.stream.EasingType.EASING_TYPE_EASE_OUT_QUAD,
  'ease-out-quart':
    vertexvis.protobuf.stream.EasingType.EASING_TYPE_EASE_OUT_QUART,
  'ease-out-sine':
    vertexvis.protobuf.stream.EasingType.EASING_TYPE_EASE_OUT_SINE,
  'ease-out-expo':
    vertexvis.protobuf.stream.EasingType.EASING_TYPE_EASE_OUT_EXPO,
};

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
    const timeout = req.timeoutInMs || DEFAULT_TIMEOUT_IN_MS;
    const animation =
      req.animation && req.animation.milliseconds
        ? {
            duration: {
              nanos: (req.animation.milliseconds % 1000) * 1000000,
              seconds: req.animation.milliseconds / 1000,
            },
            easing: req.animation?.easing
              ? easingMap[req.animation.easing]
              : undefined,
          }
        : undefined;

    const update = new Promise<FrameResponse>(resolve => {
      requests.set(corrId, resolve);
      api.replaceCamera(
        {
          camera: req.camera,
          frameCorrelationId: { value: corrId },
          animation,
        },
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
