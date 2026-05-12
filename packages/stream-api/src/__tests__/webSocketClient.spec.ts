// jsDom v20 does not have randomUUID(). remove after upgrade to jest-environment-jsdom 30+
jest.mock('@vertexvis/utils', () => {
  const utils = jest.requireActual('@vertexvis/utils');
  return {
    ...utils,
    UUID: { create: jest.fn(() => 'mock-websocket-id') },
  };
});

import { UUID } from '@vertexvis/utils';

import { ConnectionDescriptor } from '../connection';
import { WebSocketClientImpl } from '../webSocketClient';

describe('WebSocketClientImpl', () => {
  const mockClose = jest.fn();
  let globalWebSocket: any;
  beforeAll(() => {
    globalWebSocket = global.WebSocket;
    (global as any).WebSocket = class {
      public addEventListener = jest.fn((eventType, listener) =>
        eventType === 'open' ? listener() : undefined
      );

      public removeEventListener = jest.fn();
      public close = mockClose;
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    (global as any).WebSocket = globalWebSocket;
  });

  describe('connect', () => {
    it('closes any existing WebSocket associated to this client', async () => {
      const wsImpl = new WebSocketClientImpl();
      const descriptor: ConnectionDescriptor = {
        url: 'ws-url',
      };

      // Connect twice and verify that `close` is called on the existing WebSocket
      // connection to prevent open connection leaks.
      await wsImpl.connect(descriptor);
      await wsImpl.connect(descriptor);

      expect(UUID.create).toHaveBeenCalledTimes(2);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
