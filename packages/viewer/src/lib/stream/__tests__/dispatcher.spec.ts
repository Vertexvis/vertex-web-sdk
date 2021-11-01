import {
  StreamApi,
  WebSocketClientMock,
  encode,
  Fixtures,
} from '@vertexvis/stream-api';
import { StreamApiEventDispatcher } from '../dispatcher';
import '../../../testing/domMocks';
import { fromPbFrameOrThrow } from '../../mappers';
import { Orientation } from '../../types';

describe(StreamApiEventDispatcher, () => {
  const correlationId = 'corr-id';
  const mockWs = new WebSocketClientMock();
  const stream = new StreamApi(mockWs);
  const dispatcher = new StreamApiEventDispatcher(
    stream,
    (msg) =>
      msg.request?.drawFrame?.frameCorrelationIds?.some(
        (id) => id === correlationId
      ) ?? false,
    (msg) =>
      msg.request?.drawFrame != null
        ? fromPbFrameOrThrow(Orientation.DEFAULT)(msg.request.drawFrame)
        : undefined,
    5
  );

  beforeEach(async () => {
    await stream.connect({ url: '' });
  });

  afterEach(() => {
    mockWs.reset();
    jest.restoreAllMocks();
  });

  it('invokes listeners if a message matching the predicate comes across the WS', async () => {
    const res = dispatcher.once();

    mockWs.receiveMessage(
      encode(
        Fixtures.Requests.drawFrame({
          payload: { frameCorrelationIds: [correlationId] },
        })
      )
    );

    expect(await res).toMatchObject(
      expect.objectContaining({
        correlationIds: expect.arrayContaining([correlationId]),
      })
    );
  });

  it('does not invoke listeners if a message failing the predicate comes across the WS', () => {
    const res = dispatcher.once();

    mockWs.receiveMessage(
      encode(
        Fixtures.Requests.drawFrame({
          payload: { frameCorrelationIds: [] },
        })
      )
    );

    expect(res).rejects.toEqual(new Error('Promise timed out after 5ms'));
  });
});
