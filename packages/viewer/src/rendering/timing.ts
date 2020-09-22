import { SynchronizedClock } from '../types';
import {
  RequestMessageHandler,
  toProtoDuration,
  protoToDate,
  StreamApi,
} from '@vertexvis/stream-api';
import { google } from '@vertexvis/frame-streaming-protos';
import { ifRequestId, ifDrawFrame } from './utils';

function calculateSendToReceiveDuration(
  clock: SynchronizedClock | undefined,
  sentAt: Date
): google.protobuf.IDuration | undefined {
  if (clock != null) {
    const receivedAt = new Date(Date.now());
    return toProtoDuration(sentAt, receivedAt);
  }
}

/**
 * Returns a request handler that will acknowledge any frame requests that it
 * receives.
 *
 * @param api The client to acknowledge frames from.
 * @param clock A function that returns a synchronized clock.
 */
export function acknowledgeFrameRequests(
  api: StreamApi,
  clockProvider: () => SynchronizedClock | undefined
): RequestMessageHandler {
  return ifRequestId(reqId =>
    ifDrawFrame(_ => req => {
      const protoDate = protoToDate(req.sentAtTime);
      if (protoDate != null) {
        const sendToReceiveDuration = calculateSendToReceiveDuration(
          clockProvider(),
          protoDate
        );

        api.replyResult(reqId, {
          drawFrame: {
            sendToReceiveDuration,
          },
        });
      }
    })
  );
}
