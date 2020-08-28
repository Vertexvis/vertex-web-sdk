import { createRenderer } from '../renderer';
import { FrameCamera, SynchronizedClock } from '../../types';
import {
  StreamApi,
  WebSocketClientMock,
  encode,
  Fixtures,
  decode,
  toProtoTimestamp,
} from '@vertexvis/stream-api';
import '../../testing/domMocks';
import Long from 'long';

describe(createRenderer, () => {
  const mockWs = new WebSocketClientMock();
  const api = new StreamApi(mockWs);

  const camera = FrameCamera.create();
  const correlationId = 'corr-id';

  const remoteTime = new Date('2020-08-01T17:00:00.000Z');
  const localTime = new Date('2020-08-01T17:00:00.000Z');
  const clock = new SynchronizedClock(remoteTime, localTime);

  const render = createRenderer(api, clock);

  beforeEach(async () => {
    await api.connect({ url: '' });
  });

  afterEach(() => {
    mockWs.reset();
    jest.restoreAllMocks();
  });

  it('makes a request to render a frame', async () => {
    const req = render({ correlationId, camera });
    mockWs.receiveMessage(
      encode(
        Fixtures.Requests.drawFrame({
          payload: { frameCorrelationIds: [correlationId] },
        })
      )
    );
    const resp = await req;
    expect(resp.frame.sequenceNumber).toBe(1);
  });

  it('throws exception if render times out', async () => {
    const req = render({ correlationId, camera, timeoutInMs: 10 });
    await expect(req).rejects.toThrow();
  });

  it('sends response with timings if request id is defined', async () => {
    const receivedAt = new Date(localTime.getTime() + 1000);
    jest
      .spyOn(global.Date, 'now')
      .mockImplementation(() => receivedAt.getTime());

    const req = render({ correlationId, camera });

    mockWs.receiveMessage(
      encode(
        Fixtures.Requests.drawFrame(
          {
            requestId: 'req-id',
            payload: {
              sequenceNumber: 1,
              frameCorrelationIds: [correlationId],
            },
          },
          { sentAtTime: toProtoTimestamp(remoteTime) }
        )
      )
    );
    await req;

    const frame = mockWs.skipSent().nextSent(decode);

    expect(frame).toMatchObject({
      response: expect.objectContaining({
        requestId: { value: 'req-id' },
        drawFrame: {
          timing: expect.objectContaining({
            sequenceNumber: 1,
            sendToReceiveDuration: {
              seconds: new Long(1, 0, false),
              nanos: 0,
            },
          }),
        },
      }),
    });
  });

  it('skips response if request has an undefined request id', async () => {
    const req = render({ correlationId, camera });

    mockWs.receiveMessage(
      encode(
        Fixtures.Requests.drawFrame(
          {
            payload: {
              sequenceNumber: 1,
              frameCorrelationIds: [correlationId],
            },
          },
          { sentAtTime: toProtoTimestamp(remoteTime) }
        )
      )
    );
    await req;

    expect(mockWs.skipSent().hasNextSent()).toBe(false);
  });
});
