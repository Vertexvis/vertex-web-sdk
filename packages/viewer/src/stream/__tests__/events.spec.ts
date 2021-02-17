import { streamEventHandler, createStreamEventHandler } from '../events';
import {
  WebSocketClientMock,
  StreamApi,
  encode,
  Fixtures,
} from '@vertexvis/stream-api';
import '../../testing/domMocks';

describe(streamEventHandler, () => {
  const mockWs = new WebSocketClientMock();
  const api = new StreamApi(mockWs);

  const eventHandler = createStreamEventHandler(api);

  beforeEach(async () => {
    await api.connect({ url: '' });
  });

  afterEach(() => {
    mockWs.reset();
    jest.restoreAllMocks();
  });

  it('should resolve the animationCompleted promise when a corresponding event comes through', () => {
    const animationId = 'some-id';
    const promise = eventHandler(animationId);

    mockWs.receiveMessage(
      encode(Fixtures.Events.animationCompleted(animationId))
    );

    return promise;
  });
});
