import { WebSocketClient } from './webSocketClient';
import { UrlProvider } from './url';
import { parseStreamMessage } from './responses';
import {
  HitItemsPayload,
  ReconnectPayload,
  ReplaceCameraPayload,
  StartStreamPayload,
} from './types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';

type ResponseHandler = (
  response: vertexvis.protobuf.stream.IStreamResponse
) => void;

type RequestHandler = (
  request: vertexvis.protobuf.stream.IStreamRequest
) => void;

interface StringValue {
  value?: string;
}

interface ParseArgsRequest<T> {
  requestId?: StringValue;
  data?: T;
}

export class StreamApi {
  private onResponseDispatcher = new EventDispatcher<
    vertexvis.protobuf.stream.IStreamResponse
  >();

  private onRequestDispatcher = new EventDispatcher<
    vertexvis.protobuf.stream.IStreamRequest
  >();

  private messageSubscription?: Disposable;

  public constructor(
    private websocket: WebSocketClient = new WebSocketClient()
  ) {}

  public async connect(urlProvider: UrlProvider): Promise<Disposable> {
    await this.websocket.connect(urlProvider);
    this.messageSubscription = this.websocket.onMessage(message => {
      this.handleMessage(message);
    });

    return { dispose: () => this.dispose() };
  }

  public dispose(): void {
    this.websocket.close();
    this.messageSubscription?.dispose();
  }

  public onResponse(handler: ResponseHandler): Disposable {
    return this.onResponseDispatcher.on(handler);
  }

  public onRequest(handler: RequestHandler): Disposable {
    return this.onRequestDispatcher.on(handler);
  }

  public startStream(
    data: StartStreamPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest(
      {
        startStream: data,
      },
      withResponse
    );
  }

  public async reconnect(
    data: ReconnectPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest(
      {
        reconnect: data,
      },
      withResponse
    );
  }

  public beginInteraction(
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest(
      {
        beginInteraction: {},
      },
      withResponse
    );
  }

  public replaceCamera(
    { camera }: ReplaceCameraPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ updateCamera: { camera } }, withResponse);
  }

  public hitItems(
    { point }: HitItemsPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest(
      {
        hitItems: { point },
      },
      withResponse
    );
  }

  public createSceneAlteration(
    request: vertexvis.protobuf.stream.ICreateSceneAlterationRequest,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest(
      {
        createSceneAlteration: request,
      },
      withResponse
    );
  }

  public endInteraction(
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IBeginInteractionResult> {
    return this.sendRequest(
      {
        endInteraction: {},
      },
      withResponse
    );
  }

  private sendRequest(
    request: vertexvis.protobuf.stream.IStreamRequest,
    withResponse: boolean
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    if (withResponse) {
      const requestId = UUID.create();
      request = {
        requestId: {
          value: requestId,
        },
        ...request,
      };
      return new Promise(resolve => {
        const subscription = this.onResponse(response => {
          if (requestId === response.requestId?.value) {
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
    return Promise.resolve({});
  }

  private handleMessage(message: MessageEvent): void {
    const messagePayload = parseStreamMessage(message.data);

    if (messagePayload != null && messagePayload.response != null) {
      this.onResponseDispatcher.emit(messagePayload.response);
    }

    if (messagePayload != null && messagePayload.request != null) {
      this.onRequestDispatcher.emit(messagePayload.request);
    }
  }
}
