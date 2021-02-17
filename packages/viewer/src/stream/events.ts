import { EventMessage, StreamApi } from '@vertexvis/stream-api';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Async } from '@vertexvis/utils';

// type Resolver = (event: EventMessage) => boolean;
// type EventTypes = keyof vertexvis.protobuf.stream.IStreamEvent;
// type EventResolvers = Partial<Record<EventTypes, Resolver>>;

export type StreamEvents = Partial<
  Record<keyof vertexvis.protobuf.stream.IStreamEvent, Promise<void>>
>;

// export function streamEvents(eventResolvers: EventResolvers): StreamEvents {
//   const eventKeys = (obj: Partial<Record<EventTypes, any>>): EventTypes[] => {
//     return Object.keys(obj).map(k => k as EventTypes);
//   };

//   let resolves: Partial<Record<
//     EventTypes,
//     (event: EventMessage) => void | undefined
//   >> = {};
//   const promises: Partial<Record<
//     EventTypes,
//     VoidFunction | undefined
//   >> = eventKeys(eventResolvers).reduce((res, key) => {
//     return {
//       ...res,
//       [key]: new Promise(resolve => {
//         resolves = {
//           ...resolves,
//           [key]: (event: EventMessage) => {
//             if (eventResolvers[key]?.(event)) {
//               resolve();
//             }
//           },
//         };
//       }),
//     };
//   }, {});

//   return {
//     handleEvent(event: EventMessage) {
//       const eventType = eventKeys(resolves).find(k => event.event[k] != null);
//       if (eventType != null) {
//         resolves[eventType]?.(event);
//       }
//     },
//     ...eventKeys(promises).reduce((res, event) => {
//       return {
//         ...res,
//         [event]: promises[event],
//       };
//     }, {}),
//   };
// }

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
