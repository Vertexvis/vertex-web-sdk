import { vertexvis } from '@vertexvis/frame-streaming-protos';

export class StreamRequestError extends Error {
  public constructor(
    public readonly requestId: string,
    public readonly requestPayload: vertexvis.protobuf.stream.IStreamRequest,
    public readonly summary: string | null | undefined,
    public readonly details: string | null | undefined
  ) {
    super(
      summary != null && summary.length > 0
        ? `Stream request failed (${summary})`
        : 'Stream request failed'
    );
  }
}
