import { toProtoTimestamp, toProtoDuration, protoToDate } from '../time';
import { google } from '@vertexvis/frame-streaming-protos';

describe(toProtoTimestamp, () => {
  const fixedDate = new Date('2020-08-01T18:08:00.100Z');

  it('returns a Google PB Timestamp', () => {
    const timestamp = toProtoTimestamp(fixedDate);
    expect(timestamp).toMatchObject({
      seconds: 1596305280,
      nanos: 100000000,
    });
  });
});

describe(toProtoDuration, () => {
  const start = new Date('2020-08-01T18:00:00.000Z');
  const end = new Date('2020-08-01T18:01:00.100Z');
  const millis = 1000;

  it('returns a start and end date as Google PB Duration', () => {
    const duration = toProtoDuration(start, end);
    expect(duration).toMatchObject({
      seconds: 60,
      nanos: 100000000,
    });
  });

  it('returns milliseconds as Google PB Duration', () => {
    const duration = toProtoDuration(millis);
    expect(duration).toMatchObject({ seconds: 1, nanos: 0 });
  });

  it('returns correct duration if negative', () => {
    const duration = toProtoDuration(-1);
    expect(duration).toMatchObject({ seconds: -0, nanos: -1000000 });
  });

  it('returns correct duration if negative', () => {
    const duration = toProtoDuration(-1000);
    expect(duration).toMatchObject({ seconds: -1, nanos: -0 });
  });
});

describe(protoToDate, () => {
  const fixedDate = new Date('2020-08-01T18:08:00.100Z');
  const start = new Date('2020-08-01T18:00:00.000Z');
  const end = new Date('2020-08-01T18:01:00.100Z');

  it('converts timestamp to date', () => {
    const timestamp = toProtoTimestamp(fixedDate);
    const date = protoToDate(timestamp);
    expect(fixedDate.getTime()).toEqual(date.getTime());
  });

  it('converts duration to date', () => {
    const duration = toProtoDuration(start, end);
    const date = protoToDate(duration);
    expect(date.getTime()).toEqual(60100);
  });

  it('returns undefined if input is missing seconds or nanos', () => {
    const timestamp: google.protobuf.ITimestamp = { seconds: 60 };
    const date = protoToDate(timestamp);
    expect(date).toBeUndefined();
  });
});
