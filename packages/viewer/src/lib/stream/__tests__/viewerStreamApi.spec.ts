jest.mock('@vertexvis/utils', () => {
  const utils = jest.requireActual('@vertexvis/utils');
  return {
    ...utils,
    UUID: { create: jest.fn() },
  };
});

import { ViewerStreamApi } from '../viewerStreamApi';
import { WebSocketClientMock } from '@vertexvis/stream-api';

jest.useFakeTimers();

describe(ViewerStreamApi, () => {
  const ws = new WebSocketClientMock();
  const streamApi = new ViewerStreamApi(ws, false, 1, 1);
  const descriptor = { url: 'ws://foo.com' };

  const close = jest.spyOn(streamApi, 'dispose');

  beforeEach(() => {
    jest.clearAllMocks();
    ws.reset();
  });

  describe('when uninteractive', () => {
    it('disposes of its resources', async () => {
      await streamApi.connect(descriptor);
      jest.advanceTimersByTime(1);
      expect(close).toHaveBeenCalled();
    });
  });

  describe('after the client goes offline for a period of time', () => {
    it('disposes of its resources', async () => {
      await streamApi.connect(descriptor);
      window.dispatchEvent(new Event('offline'));
      jest.advanceTimersByTime(1);
      expect(close).toHaveBeenCalled();
    });
  });
});
