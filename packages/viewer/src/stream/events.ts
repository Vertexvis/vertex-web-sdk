import { StreamApi } from '@vertexvis/stream-api';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Async } from '@vertexvis/utils';

export type StreamEvents = Partial<
  Record<keyof vertexvis.protobuf.stream.IStreamEvent, Promise<void>>
>;

export type StreamEventHandler = (
  id: string,
  timeout?: number
) => Promise<void>;

const DEFAULT_TIMEOUT_MS = 10 * 1000;

export function streamEventHandler(api: StreamApi): StreamEventHandler {
  const requests = new Map<string, () => void>();

  api.onEvent(({ event }) => {
    if (event.animationCompleted?.animationId?.hex != null) {
      requests.get(event.animationCompleted.animationId.hex)?.();
    }
  });

  return (id: string, timeout = DEFAULT_TIMEOUT_MS) => {
    const promise = new Promise<void>(resolve => {
      requests.set(id, () => {
        resolve();
      });
    });

    return Async.timeout(timeout, promise).finally(() => requests.delete(id));
  };
}

export function createStreamEventHandler(api: StreamApi): StreamEventHandler {
  return streamEventHandler(api);
}
