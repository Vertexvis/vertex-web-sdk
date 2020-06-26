import { WebSocketClient } from './webSocketClient';
import { UrlProvider } from './url';
import { parseResponse } from './responses';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher } from '@vertexvis/utils';

type ResponseHandler = (
  response: vertexvis.protobuf.stream.IStreamResponse
) => void;

type RecursiveRequired<T> = { [P in keyof T]-?: RecursiveRequired<T[P]> };

export class StreamApi {
  private onResponseDispatcher = new EventDispatcher<
    vertexvis.protobuf.stream.IStreamResponse
  >();

  private messageSubscription?: Disposable;

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
    data: RecursiveRequired<vertexvis.protobuf.stream.IStartStreamPayload>
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.send({
      startStream: {
        ...data,
      },
    });
  }

  public beginInteraction(): Promise<
    vertexvis.protobuf.stream.IStreamResponse
  > {
    return this.send({
      beginInteraction: {},
    });
  }

  public replaceCamera({
    camera,
  }: RecursiveRequired<
    vertexvis.protobuf.stream.IUpdateCameraPayload
  >): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.send({
      updateCamera: {
        camera,
      },
    });
  }

  public endInteraction(): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.send({
      endInteraction: {},
    });
  }

  private send(
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
        vertexvis.protobuf.stream.StreamMessage.encode({ request }).finish()
      );
    });
  }

  private handleMessage(message: MessageEvent): void {
    const response = parseResponse(message.data);

    if (response != null) {
      this.onResponseDispatcher.emit(response);
    }
  }
}
