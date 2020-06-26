import { vertexvis } from '@vertexvis/frame-streaming-protos';

export function parseResponse(
  buffer: ArrayBuffer
): vertexvis.protobuf.stream.IStreamResponse | null | undefined {
  const bytes = new Uint8Array(buffer);
  const message = vertexvis.protobuf.stream.StreamMessage.decode(bytes);

  return message.response;
}
