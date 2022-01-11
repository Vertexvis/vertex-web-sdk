import { StreamApi } from '@vertexvis/stream-api';

import type { FrameDecoder } from '../mappers';
import { StreamApiEventDispatcher } from '../stream/dispatcher';
import { Result } from '../stream/result';
import { Frame } from '../types';

export interface RenderResultIds {
  animationId?: string;
  correlationId?: string;
}

export class CameraRenderResult implements Result {
  public data = undefined;
  public onAnimationCompleted: StreamApiEventDispatcher<string>;
  public onFrameReceived: StreamApiEventDispatcher<Frame>;

  public constructor(
    stream: StreamApi,
    decodeFrame: FrameDecoder,
    { animationId, correlationId }: RenderResultIds,
    timeout?: number
  ) {
    this.onAnimationCompleted = new StreamApiEventDispatcher(
      stream,
      (msg) => msg.event?.animationCompleted?.animationId?.hex === animationId,
      (msg) => msg.event?.animationCompleted?.animationId?.hex || undefined,
      timeout
    );
    this.onFrameReceived = new StreamApiEventDispatcher<Frame>(
      stream,
      (msg) =>
        !!msg.request?.drawFrame?.frameCorrelationIds?.some(
          (id) => id === correlationId
        ),
      (msg) =>
        msg.request?.drawFrame != null
          ? decodeFrame(msg.request.drawFrame)
          : undefined,
      timeout
    );
  }
}
