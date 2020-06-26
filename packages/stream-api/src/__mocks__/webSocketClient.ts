import { vertexvis } from '@vertexvis/frame-streaming-protos';

const messageCallbacks: ((evt: MessageEvent) => void)[] = [];

export const closeMock = jest.fn();

export const connectMock = jest.fn().mockResolvedValue(undefined);

export const sendMock = jest.fn();

export const onMessageMock = jest.fn().mockImplementation(listener => {
  messageCallbacks.push(listener);
  return { dispose: () => messageCallbacks.filter(l => l !== listener) };
});

export function simulateResponse(
  response: vertexvis.protobuf.stream.IStreamResponse
): void {
  const serialized = vertexvis.protobuf.stream.StreamMessage.encode({
    response,
  }).finish();
  const event = new MessageEvent('message', { data: serialized });
  messageCallbacks.forEach(c => c(event));
}

export function restoreMocks(): void {
  jest.restoreAllMocks();
  jest.clearAllMocks();
}

export const WebSocketClient = jest.fn().mockImplementation(() => {
  return {
    close: closeMock,
    connect: connectMock,
    onMessage: onMessageMock,
    send: sendMock,
  };
});
