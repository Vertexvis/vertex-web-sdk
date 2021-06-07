import { SynchronizedClock } from '../types';
import {
  RequestMessageHandler,
  toProtoDuration,
  protoToDate,
  StreamApi,
} from '@vertexvis/stream-api';
import { google } from '@vertexvis/frame-streaming-protos';
import { ifRequestId, ifDrawFrame } from './utils';

const MUTE_WARNING_SECONDS = 1 * 60; // 1 minute

function calculateSendToReceiveDuration(
  clockProvider: () => SynchronizedClock | undefined
): (sentAt: Date) => google.protobuf.IDuration | undefined {
  let muteWarning = false;

  return (sentAt) => {
    const clock = clockProvider();
    if (clock != null) {
      const receivedAt = clock.remoteTime(new Date(Date.now()));
      const duration = toProtoDuration(sentAt, receivedAt);

      const durationInMs = protoToDate(duration).getTime();
      if (durationInMs >= 0) {
        return duration;
      } else {
        if (!muteWarning) {
          console.warn(
            `Possible erroneous send to receive timing. Muting for ${MUTE_WARNING_SECONDS}s. [sent-at=${sentAt.toISOString()}, received-at=${receivedAt.toISOString()}, remote-time=${clock.knownRemoteTime.toISOString()}]`
          );

          muteWarning = true;
          setTimeout(() => (muteWarning = false), MUTE_WARNING_SECONDS * 1000);
        }
        return undefined;
      }
    }
  };
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
  const sendToReceiveDuration = calculateSendToReceiveDuration(clockProvider);
  return ifRequestId((reqId) =>
    ifDrawFrame((_) => (req) => {
      const sentAt = protoToDate(req.sentAtTime);
      if (sentAt != null) {
        api.replyResult(reqId, {
          drawFrame: {
            sendToReceiveDuration: sendToReceiveDuration(sentAt),
          },
        });
      }
    })
  );
}
