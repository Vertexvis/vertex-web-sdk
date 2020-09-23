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

  it('should not throw an exception ', async () => {
    const req = render({ correlationId, camera });
    await expect(req).not.toThrow
  });
});
