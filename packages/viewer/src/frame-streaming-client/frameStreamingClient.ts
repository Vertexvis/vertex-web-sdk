import { WebSocketClient } from '../websocket-client';
import { parseResponse } from './responses';
import { vertexvis } from '@vertexvis/frame-stream-protos';
import { StreamingClient } from '../streaming-client';

export class FrameStreamingClient extends StreamingClient<
  vertexvis.protobuf.stream.IStreamRequest,
  vertexvis.protobuf.stream.IStreamResponse
> {
  public constructor(websocket: WebSocketClient = new WebSocketClient()) {
    super(message => parseResponse(message.data), websocket);
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

  public beginInteraction(
    data: vertexvis.protobuf.stream.IBeginInteractionPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.send({
      beginInteraction: {
        ...data,
      },
    });
  }

  public endInteraction(
    data: vertexvis.protobuf.stream.IEndInteractionPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.send({
      endInteraction: {
        ...data,
      },
    });
  }

  public replaceCamera(
    data: vertexvis.protobuf.stream.IUpdateCameraPayload,
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.send({
      updateCamera: {
        ...data,
      },
    });
  }

  protected send(
    request: vertexvis.protobuf.stream.IStreamRequest
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return new Promise((resolve) => {
      const subscription = this.onResponse((response) => {
        if (response.frame != null) {
          resolve(response);
          subscription.dispose();
        }
      });
      this.websocket.send(
        vertexvis.protobuf.stream.StreamMessage.encode({ request }).finish()
      );
    });
  }
}
