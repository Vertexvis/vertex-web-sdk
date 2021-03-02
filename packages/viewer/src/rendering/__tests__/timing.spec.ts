import '../../testing/domMocks';
import { acknowledgeFrameRequests } from '../timing';
import { SynchronizedClock } from '../../types';
import {
  WebSocketClientMock,
  StreamApi,
  encode,
  Fixtures,
  toProtoTimestamp,
  decode,
} from '@vertexvis/stream-api';
import Long from 'long';

describe(acknowledgeFrameRequests, () => {
  const remoteTime = new Date('2020-08-01T17:00:00.000Z');
  const localTime = new Date('2020-08-01T17:00:00.000Z');
  const clock = new SynchronizedClock(remoteTime, localTime);

  const mockWs = new WebSocketClientMock();
  const api = new StreamApi(mockWs);
  api.onRequest(acknowledgeFrameRequests(api, () => clock));

  beforeEach(() => api.connect({ url: '' }));

  afterEach(() => {
    mockWs.reset();
    jest.restoreAllMocks();
  });

  it('sends a result when a draw frame request is received', () => {
    const receivedAt = new Date(localTime.getTime() + 1000);
    jest
      .spyOn(global.Date, 'now')
      .mockImplementation(() => receivedAt.getTime());

    mockWs.receiveMessage(
      encode(
        Fixtures.Requests.drawFrame(
          { requestId: 'req-id', payload: { sequenceNumber: 1 } },
          { sentAtTime: toProtoTimestamp(remoteTime) }
        )
      )
    );

    const frame = mockWs.nextSent((d) => decode(d as Uint8Array));

    expect(frame).toMatchObject({
      response: expect.objectContaining({
        requestId: { value: 'req-id' },
        drawFrame: expect.objectContaining({
          sendToReceiveDuration: {
            seconds: new Long(1, 0, false),
            nanos: 0,
          },
        }),
      }),
    });
  });

  it('ignores requests without a request id', () => {
    mockWs.receiveMessage(
      encode(
        Fixtures.Requests.drawFrame(
          { payload: { sequenceNumber: 1 } },
          { sentAtTime: toProtoTimestamp(remoteTime) }
        )
      )
    );

    expect(mockWs.hasNextSent()).toBe(false);
  });

  it('ignores requests that are not draw frame requests', () => {
    mockWs.receiveMessage(encode(Fixtures.Requests.gracefulReconnect()));
    expect(mockWs.hasNextSent()).toBe(false);
  });
});
