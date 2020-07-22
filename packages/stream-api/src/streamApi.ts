import { WebSocketClient } from './webSocketClient';
import { UrlProvider } from './url';
import { parseResponse } from './responses';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';

type ResponseHandler = (
  response: vertexvis.protobuf.stream.IStreamResponse
) => void;

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
    data: vertexvis.protobuf.stream.IStartStreamPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequestWithId({
      requestId: {
        value: UUID.create(),
      },
      startStream: {
        ...data,
      },
    });
  }

  public beginInteraction(): Promise<void> {
    return this.sendRequest({
      beginInteraction: {},
    });
  }

  public replaceCamera({
    camera,
  }: vertexvis.protobuf.stream.IUpdateCameraPayload): Promise<void> {
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
    return this.sendRequestWithId({
      requestId: {
        value: requestId,
      },
      hitItems: {
        point,
      },
    });
  }

  public createSceneAlteration(
    requestId: string,
    request: vertexvis.protobuf.stream.ICreateSceneAlterationRequest
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    const givenReq = {
      requestId: {
        value: requestId,
      },
      createSceneAlteration: {
        ...request,
      },
    };
    return this.sendRequestWithId(givenReq);
  }

  public endInteraction(): Promise<void> {
    return this.sendRequest({
      endInteraction: {},
    });
  }

  private sendRequest(
    request: vertexvis.protobuf.stream.IStreamRequest
  ): Promise<void> {
    this.websocket.send(
      vertexvis.protobuf.stream.StreamMessage.encode({ request }).finish()
    );
    return Promise.resolve();
  }

  private sendRequestWithId(
    request: vertexvis.protobuf.stream.IStreamRequest
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
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
