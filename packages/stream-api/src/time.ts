import { google } from '@vertexvis/frame-streaming-protos';
import Long from 'long';

type MaybeTimestampOrDuration = Pick<
  google.protobuf.ITimestamp,
  'seconds' | 'nanos'
>;

type DefinedTimestampOrDuration = Required<
  Pick<google.protobuf.ITimestamp, 'seconds' | 'nanos'>
>;

/**
 * Converts a JS date type to a `google.protobuf.Timestamp`. The returned time
 * will be represented as UTC.
 *
 * @param date The date to convert.
 */
export function toProtoTimestamp(date: Date): google.protobuf.Timestamp {
  const millis = date.getTime();
  return google.protobuf.Timestamp.create(parseEpochMillis(millis));
}

/**
 * Returns the current date and time as a `google.protobuf.Timestamp`.
 */
export function currentDateAsProtoTimestamp(): google.protobuf.Timestamp {
  return toProtoTimestamp(new Date());
}

/**
 * Converts the given milliseconds into a `google.protobuf.Duration`.
 *
 * @param ms The milliseconds to convert.
 */
export function toProtoDuration(ms: number): google.protobuf.Duration;

/**
 * Converts the two dates into a `google.protobuf.Duration`, where the duration
 * is `end - start`. If `end` is before `start`, then the duration will be
 * negative.
 *
 * @param start The starting time.
 * @param end The ending time.
 */
export function toProtoDuration(
  start: Date,
  end: Date
): google.protobuf.Duration;

export function toProtoDuration(...args: unknown[]): google.protobuf.Duration {
  if (args.length === 2) {
    const start = args[0] as Date;
    const end = args[1] as Date;
    const millis = end.getTime() - start.getTime();
    return google.protobuf.Duration.create(parseEpochMillis(millis));
  } else if (args.length === 1) {
    const millis = args[0] as number;
    return google.protobuf.Duration.create(parseEpochMillis(millis));
  } else {
    throw new Error('Expected input to be a number or start and end date.');
  }
}

/* eslint-disable padding-line-between-statements */
/**
 * Converts a protobuf timestamp or duration to a JS date.
 *
 * @param time The timestamp or duration to convert.
 */
export function protoToDate(time: DefinedTimestampOrDuration): Date;
export function protoToDate(time: MaybeTimestampOrDuration): Date | undefined;
export function protoToDate(
  time: MaybeTimestampOrDuration | DefinedTimestampOrDuration
): Date | undefined {
  if (time.seconds != null && time.nanos != null) {
    const seconds = Long.isLong(time.seconds)
      ? time.seconds.toNumber()
      : time.seconds;
    return new Date(seconds * 1000 + time.nanos / 1000000);
  }
}
/* eslint-enable padding-line-between-statements */

function parseEpochMillis(millis: number): DefinedTimestampOrDuration {
  const seconds = Math.floor(millis / 1000);
  const nanos = (millis % 1000) * 1000000;
  return { seconds, nanos };
}
