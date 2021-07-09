import { vertexvis } from '@vertexvis/frame-streaming-protos';

export function encode(
  message: vertexvis.protobuf.stream.IStreamMessage
): Uint8Array {
  return vertexvis.protobuf.stream.StreamMessage.encode(message).finish();
}

export function decode(
  bufferOrBytes: ArrayBuffer | Uint8Array
): vertexvis.protobuf.stream.IStreamMessage {
  const bytes =
    bufferOrBytes instanceof ArrayBuffer
      ? new Uint8Array(bufferOrBytes)
      : bufferOrBytes;
  const message = vertexvis.protobuf.stream.StreamMessage.decode(bytes);
  return vertexvis.protobuf.stream.StreamMessage.toObject(message, {
    defaults: true,
  });
}
