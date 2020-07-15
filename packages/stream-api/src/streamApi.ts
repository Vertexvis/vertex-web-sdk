import { WebSocketClient } from './webSocketClient';
import { UrlProvider } from './url';
import { parseResponse } from './responses';
import { vertexvis, google } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';

type ResponseHandler = (
  response: vertexvis.protobuf.stream.IStreamResponse
) => void;

interface ParseArgsRequest {
  requestId?: google.protobuf.IStringValue;
  data: any;
}

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
  ): Promise<void>;

  public startStream(
    requestId: UUID.UUID,
    data: vertexvis.protobuf.stream.IStartStreamPayload
  ): Promise<vertexvis.protobuf.stream.IStartStreamResult>;

  public startStream(...args: unknown[]): unknown {
    const request = this.parseArgs(args);
    return this.sendRequest({
      ...request.requestId,
      startStream: {
        ...request.data,
      },
    });
  }

  public beginInteraction(): Promise<void>;

  public beginInteraction(
    requestId: UUID.UUID
  ): Promise<vertexvis.protobuf.stream.IBeginInteractionResult>;

  public beginInteraction(...args: unknown[]): unknown {
    const request = this.parseArgs(args);
    return this.sendRequest({
      ...request.requestId,
      beginInteraction: {},
    });
  }

  public replaceCamera({
    camera,
  }: vertexvis.protobuf.stream.IUpdateCameraPayload): Promise<void>;

  public replaceCamera(
    requestId: UUID.UUID,
    { camera }: vertexvis.protobuf.stream.IUpdateCameraPayload
  ): Promise<vertexvis.protobuf.stream.IUpdateCameraResult>;

  public replaceCamera(...args: unknown[]): unknown {
    const request = this.parseArgs(args);
    const requestPayload = {
      ...request.requestId,
      updateCamera: {
        camera: request.data as vertexvis.protobuf.stream.ICamera,
      },
    };
    return this.sendRequest(requestPayload);
  }

  public hitItems({
    point,
  }: vertexvis.protobuf.stream.IHitItemsPayload): Promise<void>;

  public hitItems(
    requestId: string,
    { point }: vertexvis.protobuf.stream.IHitItemsPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse>;

  public hitItems(...args: unknown[]): unknown {
    const request = this.parseArgs(args);
    return this.sendRequest({
      ...request.requestId,
      hitItems: {
        point: request.data as vertexvis.protobuf.stream.IPoint,
      },
    });
  }

  public endInteraction(): Promise<void>;

  public endInteraction(
    requestId: UUID.UUID
  ): Promise<vertexvis.protobuf.stream.IBeginInteractionResult>;

  public endInteraction(...args: unknown[]): unknown {
    const request = this.parseArgs(args);
    return this.sendRequest({
      ...request.requestId,
      endInteraction: {},
    });
  }

  private parseArgs(args: unknown[]): ParseArgsRequest {
    const requestId =
      typeof args[0] === 'string' ? { requestId: { value: args[0] } } : {};
    const request = {
      ...requestId,
      data: typeof args[0] === 'object' ? args[0] : args[1],
    };
    return request;
  }

  private sendRequest(
    request: vertexvis.protobuf.stream.IStreamRequest
  ): Promise<void | vertexvis.protobuf.stream.IStreamResponse> {
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
        this.websocket.send(
          vertexvis.protobuf.stream.StreamMessage.encode({ request }).finish()
        );
      });
    }
    this.websocket.send(
      vertexvis.protobuf.stream.StreamMessage.encode({ request }).finish()
    );
    return Promise.resolve();
  }

  private handleMessage(message: MessageEvent): void {
    const response = parseResponse(message.data);

    if (response != null) {
      this.onResponseDispatcher.emit(response);
    }
  }
}
