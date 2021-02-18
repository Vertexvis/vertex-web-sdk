import { createStreamApiRenderer } from '../remote';
import { FrameCamera } from '../../types';
import {
  StreamApi,
  WebSocketClientMock,
  encode,
  Fixtures,
} from '@vertexvis/stream-api';
import '../../testing/domMocks';

describe(createStreamApiRenderer, () => {
  const mockWs = new WebSocketClientMock();
  const api = new StreamApi(mockWs);

  const camera = FrameCamera.create();
  const correlationId = 'corr-id';

  const render = createStreamApiRenderer(api);

  beforeEach(async () => {
    await api.connect({ url: '' });
    (api.flyTo as any) = jest.fn(() =>
      Promise.resolve({ animationId: 'some-id' })
    );
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

  it('should render given an animation and fly to op', async () => {
    const req = render({
      correlationId,
      camera,
      flyToOptions: {
        flyTo: {
          type: 'supplied',
          data: 'givenId',
        },
      },
      animation: {
        milliseconds: 500,
      },
    });
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
});
