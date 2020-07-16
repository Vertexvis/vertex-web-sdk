import { WebSocketClient } from './webSocketClient';
import { UrlProvider } from './url';
import { parseResponse } from './responses';
import {
  HitItemsPayload,
  ReplaceCameraPayload,
  StartStreamPayload,
} from './types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';

type ResponseHandler = (
  response: vertexvis.protobuf.stream.IStreamResponse
) => void;

interface StringValue {
  value?: string;
}

interface ParseArgsRequest<T> {
  requestId?: StringValue;
  data: T;
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

  public startStream(data: StartStreamPayload): Promise<void>;

  public startStream(
    requestId: UUID.UUID,
    data: StartStreamPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse>;

  public startStream(...args: unknown[]): unknown {
    const request = this.parseArgs<
      vertexvis.protobuf.stream.StartStreamPayload
    >(args);
    return this.sendRequest({
      requestId: request.requestId,
      startStream: { ...request.data },
    });
  }

  public beginInteraction(): Promise<void>;

  public beginInteraction(
    requestId: UUID.UUID
  ): Promise<vertexvis.protobuf.stream.IStreamResponse>;

  public beginInteraction(...args: unknown[]): unknown {
    const request = this.parseArgs<
      vertexvis.protobuf.stream.BeginInteractionPayload
    >(args);
    return this.sendRequest({
      requestId: request.requestId,
      beginInteraction: { ...request.data },
    });
  }

  public replaceCamera({ camera }: ReplaceCameraPayload): Promise<void>;

  public replaceCamera(
    requestId: UUID.UUID,
    { camera }: ReplaceCameraPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse>;

  public replaceCamera(...args: unknown[]): unknown {
    const request = this.parseArgs<
      vertexvis.protobuf.stream.IUpdateCameraPayload
    >(args);
    const requestPayload = {
      requestId: request.requestId,
      updateCamera: { ...request.data },
    };
    return this.sendRequest(requestPayload);
  }

  public hitItems({ point }: HitItemsPayload): Promise<void>;

  public hitItems(
    requestId: string,
    { point }: HitItemsPayload
  ): Promise<vertexvis.protobuf.stream.IStreamResponse>;

  public hitItems(...args: unknown[]): unknown {
    const request = this.parseArgs<vertexvis.protobuf.stream.IHitItemsPayload>(
      args
    );
    return this.sendRequest({
      requestId: request.requestId,
      hitItems: { ...request.data },
    });
  }

  public endInteraction(): Promise<void>;

  public endInteraction(
    requestId: UUID.UUID
  ): Promise<vertexvis.protobuf.stream.IBeginInteractionResult>;

  public endInteraction(...args: unknown[]): unknown {
    const request = this.parseArgs(args);
    return this.sendRequest({
      requestId: request.requestId,
      endInteraction: {},
    });
  }

  private parseArgs<T>(args: unknown[]): ParseArgsRequest<T> {
    const requestId =
      typeof args[0] === 'string' ? { value: args[0] } : undefined;
    const data = (typeof args[0] === 'object' ? args[0] : args[1]) as T;
    const request: ParseArgsRequest<T> = {
      requestId,
      data,
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
