import { vertexvis } from '@vertexvis/frame-stream-protos';

export function parseResponse(
  buffer: ArrayBuffer
): vertexvis.protobuf.stream.IStreamResponse {
  const bytes = new Uint8Array(buffer);
  const message = vertexvis.protobuf.stream.StreamMessage.decode(bytes);

  return message.response;
}
