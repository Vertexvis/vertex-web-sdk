import { StreamApi } from '@vertexvis/stream-api';
import { Result } from '../stream/result';
import { StreamApiEventDispatcher } from '../stream/dispatcher';
import { ReceivedFrame } from '../types/frame';
import { mapFrame } from '../mappers';
import { Mapper } from '@vertexvis/utils';

export interface RenderResultIds {
  animationId?: string;
  correlationId?: string;
}

export class CameraRenderResult implements Result {
  public data = undefined;
  public onAnimationCompleted: StreamApiEventDispatcher<string>;
  public onFrameReceived: StreamApiEventDispatcher<ReceivedFrame>;

  public constructor(
    stream: StreamApi,
    { animationId, correlationId }: RenderResultIds,
    timeout?: number
  ) {
    this.onAnimationCompleted = new StreamApiEventDispatcher(
      stream,
      (msg) => msg.event?.animationCompleted?.animationId?.hex === animationId,
      (msg) => msg.event?.animationCompleted?.animationId?.hex || undefined,
      timeout
    );
    this.onFrameReceived = new StreamApiEventDispatcher(
      stream,
      (msg) =>
        !!msg.request?.drawFrame?.frameCorrelationIds?.some(
          (id) => id === correlationId
        ),
      (msg) =>
        msg.request?.drawFrame != null
          ? Mapper.ifInvalidThrow(mapFrame)(msg.request.drawFrame)
          : undefined,
      timeout
    );
  }
}
