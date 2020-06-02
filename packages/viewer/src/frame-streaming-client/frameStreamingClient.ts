import { WebSocketClient } from '../websocket-client';
import { parseResponse } from './responses';
import { vertexvis } from '@vertexvis/frame-stream-protos';
import { StreamingClient } from '../streaming-client';

export class FrameStreamingClient extends StreamingClient<
  vertexvis.protobuf.stream.IStreamRequest,
  vertexvis.protobuf.stream.IStreamResponse
> {
  public constructor(websocket: WebSocketClient = new WebSocketClient()) {
    super(
      request =>
        vertexvis.protobuf.stream.StreamRequest.encode(request).finish(),
      message => parseResponse(message.data),
      websocket
    );
  }

  public startStream(
    data: vertexvis.protobuf.stream.IStartStreamPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.send({
      startStream: {
        ...data,
      },
    });
  }

  protected send(
    request: vertexvis.protobuf.stream.IStreamRequest
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return new Promise(resolve => {
      const subscription = this.onResponse(response => {
        if (response.frame != null) {
          resolve(response);
          subscription.dispose();
        }
      });
      this.websocket.send(
        vertexvis.protobuf.stream.StreamRequest.encode(request).finish()
      );
    });
  }
}
