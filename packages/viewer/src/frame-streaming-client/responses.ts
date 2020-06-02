import { vertexvis } from '@vertexvis/frame-stream-protos';

export function parseResponse(
  buffer: ArrayBuffer
): vertexvis.protobuf.stream.StreamResponse {
  const bytes = new Uint8Array(buffer);

  return vertexvis.protobuf.stream.StreamResponse.decode(bytes);
}
