import { vertexvis } from '@vertexvis/frame-streaming-protos';

export function encode(
  message: vertexvis.protobuf.stream.IStreamMessage
): Uint8Array {
  return vertexvis.protobuf.stream.StreamMessage.encode(message).finish();
}

export function decode(
  bytes: Uint8Array
): vertexvis.protobuf.stream.IStreamMessage {
  return vertexvis.protobuf.stream.StreamMessage.decode(bytes);
}
