import { StreamApi } from '@vertexvis/stream-api';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Async } from '@vertexvis/utils';

export type StreamEvents = Partial<
  Record<keyof vertexvis.protobuf.stream.IStreamEvent, Promise<void>>
>;

export type StreamEventHandler = (id: string) => Promise<void>;

export function streamEventHandler(api: StreamApi): StreamEventHandler {
  const requests = new Map<string, () => void>();

  api.onEvent(({ event }) => {
    if (event.animationCompleted?.animationId?.hex != null) {
      requests.get(event.animationCompleted.animationId.hex)?.();
    }
  });

  return (id: string) => {
    const promise = new Promise<void>(resolve => {
      requests.set(id, () => {
        resolve();
      });
    });

    return Async.timeout(10 * 1000, promise).finally(() => requests.delete(id));
  };
}

export function createStreamEventHandler(api: StreamApi): StreamEventHandler {
  return streamEventHandler(api);
}
