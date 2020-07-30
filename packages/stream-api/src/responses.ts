import { vertexvis } from '@vertexvis/frame-streaming-protos';

export function parseStreamMessage(
  buffer: ArrayBuffer
): vertexvis.protobuf.stream.IStreamMessage | null | undefined {
  const bytes = new Uint8Array(buffer);
  const message = vertexvis.protobuf.stream.StreamMessage.decode(bytes);

  return message;
}
