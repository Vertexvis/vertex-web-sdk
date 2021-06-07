import {
  StreamApi,
  WebSocketClientMock,
  encode,
  Fixtures,
} from '@vertexvis/stream-api';
import { CameraRenderResult } from '../cameraRenderResult';
import '../../../testing/domMocks';

describe(CameraRenderResult, () => {
  const correlationId = 'corr-id';
  const animationId = 'animation-id';
  const mockWs = new WebSocketClientMock();
  const stream = new StreamApi(mockWs);
  const result = new CameraRenderResult(
    stream,
    {
      correlationId,
      animationId,
    },
    5
  );

  beforeEach(async () => {
    await stream.connect({ url: '' });
  });

  afterEach(() => {
    mockWs.reset();
    jest.restoreAllMocks();
  });

  it('should support animation completed events', async () => {
    const listener = jest.fn();
    result.onAnimationCompleted.on(listener);
    const res = result.onAnimationCompleted.once();

    mockWs.receiveMessage(
      encode(Fixtures.Events.animationCompleted(animationId))
    );

    expect(await res).toBe(animationId);
    expect(listener).toHaveBeenCalledWith(animationId);
  });

  it('should support frame received events', async () => {
    const listener = jest.fn();
    result.onFrameReceived.on(listener);
    const res = result.onFrameReceived.once();

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
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationIds: expect.arrayContaining([correlationId]),
      })
    );
  });
});
