import { WebSocketClient } from './webSocketClient';
import { UrlProvider } from './url';
import { parseResponse } from './responses';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher } from '@vertexvis/utils';

type ResponseHandler = (
  response: vertexvis.protobuf.stream.IStreamResponse
) => void;

export class StreamApi {
  private onResponseDispatcher = new EventDispatcher<
    vertexvis.protobuf.stream.IStreamResponse
  >();

  private messageSubscription?: Disposable;

  private requestSubscriptions: { [requestId: string]: Disposable } = {};

  public constructor(
    private websocket: WebSocketClient = new WebSocketClient()
  ) {}

  public async connect(urlProvider: UrlProvider): Promise<Disposable> {
    await this.websocket.connect(urlProvider);
    this.messageSubscription = this.websocket.onMessage(message =>
      this.handleMessage(message)
    );
    return { dispose: () => this.dispose() };
  }

  public dispose(): void {
    this.websocket.close();
    this.messageSubscription?.dispose();
  }

  public onResponse(handler: ResponseHandler): Disposable {
    return this.onResponseDispatcher.on(handler);
  }

  public startStream(
    data: vertexvis.protobuf.stream.IStartStreamPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({
      startStream: {
        ...data,
      },
    });
  }

  public beginInteraction(): Promise<
    vertexvis.protobuf.stream.IStreamResponse
  > {
    return this.sendRequest({
      beginInteraction: {},
    });
  }

  public replaceCamera({
    camera,
  }: vertexvis.protobuf.stream.IUpdateCameraPayload): Promise<
    vertexvis.protobuf.stream.IStreamResponse
  > {
    return this.sendRequest({
      updateCamera: {
        camera,
      },
    });
  }

  public hitItems(
    requestId: string,
    { point }: vertexvis.protobuf.stream.IHitItemsPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({
      requestId: {
        value: requestId,
      },
      hitItems: {
        point,
      },
    });
  }

  public endInteraction(): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({
      endInteraction: {},
    });
  }

  private sendRequest(
    request: vertexvis.protobuf.stream.IStreamRequest
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    this.websocket.send(
      vertexvis.protobuf.stream.StreamMessage.encode({ request }).finish()
    );
    if (request.requestId?.value != null) {
      return new Promise(resolve => {
        const subscription = this.onResponse(response => {
          if (
            request.requestId?.value != null &&
            request.requestId?.value === response.requestId?.value
          ) {
            resolve(response);
            subscription.dispose();
          }
        });
      });
    }
    return Promise.resolve({});
  }

  private handleMessage(message: MessageEvent): void {
    const response = parseResponse(message.data);

    if (response != null) {
      this.onResponseDispatcher.emit(response);
    }
  }
}
