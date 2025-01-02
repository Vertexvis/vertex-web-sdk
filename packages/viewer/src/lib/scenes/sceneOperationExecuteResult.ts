import { StreamApi } from '@vertexvis/stream-api';

import type { FrameDecoder } from '../mappers';
import { StreamApiEventDispatcher } from '../stream/dispatcher';
import { Frame } from '../types';

export const SCENE_ALTERATION_DEFAULT_TIMEOUT_MS = 1000 * 30;

export class SceneOperationExecuteResult {
  public onFrameDrawn: StreamApiEventDispatcher<Frame>;

  public constructor(
    stream: StreamApi,
    decodeFrame: FrameDecoder,
    correlationId: string,
    timeout?: number
  ) {
    this.onFrameDrawn = new StreamApiEventDispatcher<Frame>(
      stream,
      (msg) =>
        !!msg.request?.drawFrame?.frameCorrelationIds?.some(
          (id) => id === correlationId
        ),
      (msg) =>
        msg.request?.drawFrame != null
          ? decodeFrame(msg.request.drawFrame)
          : undefined,
      timeout ?? SCENE_ALTERATION_DEFAULT_TIMEOUT_MS
    );
  }
}
