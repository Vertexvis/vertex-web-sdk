import { UUID } from '@vertexvis/utils';
import { vi } from 'vitest';

import { ConnectionDescriptor } from '../connection';
import { WebSocketClientImpl } from '../webSocketClient';

describe('WebSocketClientImpl', () => {
  const mockClose = vi.fn();
  const mockSend = vi.fn();
  let globalWebSocket: any;
  beforeAll(() => {
    globalWebSocket = global.WebSocket;
    (global as any).WebSocket = class {
      public addEventListener = vi.fn((eventType, listener) =>
        eventType === 'open' ? listener() : undefined,
      );

      public removeEventListener = vi.fn();
      public close = mockClose;
      public send = mockSend;
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    (global as any).WebSocket = globalWebSocket;
  });

  it('connect closes any existing WebSocket associated to this client', async () => {
    const uuidCreateSpy = vi.spyOn(UUID, 'create');
    const wsImpl = new WebSocketClientImpl();
    const descriptor: ConnectionDescriptor = {
      url: 'ws-url',
    };

    // Connect twice and verify that `close` is called on the existing WebSocket
    // connection to prevent open connection leaks.
    await wsImpl.connect(descriptor);
    await wsImpl.connect(descriptor);

    expect(uuidCreateSpy).toHaveBeenCalledTimes(2);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('copies shared buffers into WebSocket-compatible binary data', async () => {
    const wsImpl = new WebSocketClientImpl();
    await wsImpl.connect({ url: 'ws-url' });

    const buffer = new SharedArrayBuffer(4);
    new Uint8Array(buffer).set([1, 2, 3, 4]);
    wsImpl.send(buffer);
    wsImpl.send(new Uint8Array(buffer, 1, 2));

    expect(mockSend).toHaveBeenNthCalledWith(1, new Uint8Array([1, 2, 3, 4]));
    expect(mockSend).toHaveBeenNthCalledWith(2, new Uint8Array([2, 3]));
  });
});
