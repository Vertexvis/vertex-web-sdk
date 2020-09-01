import { SynchronizedClock } from '../types';
import {
  RequestMessageHandler,
  toProtoDuration,
  protoToDate,
  StreamApi,
} from '@vertexvis/stream-api';
import { google } from '@vertexvis/frame-streaming-protos';
import { DrawFramePayload } from '@vertexvis/stream-api/dist/types';

function calculateSendToReceiveDuration(
  clock: SynchronizedClock | undefined,
  sentAt: Date
): google.protobuf.IDuration | undefined {
  if (clock != null) {
    const receivedAt = new Date(Date.now());
    return toProtoDuration(sentAt, receivedAt);
  }
}

function ifRequestId(
  f: (id: string) => RequestMessageHandler
): RequestMessageHandler {
  return req => {
    const reqId = req.request.requestId?.value;
    if (reqId != null) {
      f(reqId)(req);
    }
  };
}

function ifDrawFrame(
  f: (frame: DrawFramePayload) => RequestMessageHandler
): RequestMessageHandler {
  return req => {
    const { drawFrame } = req.request;

    if (drawFrame != null) {
      f(drawFrame as DrawFramePayload)(req);
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
  return ifRequestId(reqId =>
    ifDrawFrame(frame => req => {
      const sendToReceiveDuration = calculateSendToReceiveDuration(
        clockProvider(),
        protoToDate(req.sentAtTime)
      );

      api.replyResult(reqId, {
        drawFrame: {
          timing: {
            sequenceNumber: frame.sequenceNumber,
            sendToReceiveDuration,
          },
        },
      });
    })
  );
}
