import { WebSocketClient } from './webSocketClient';
import { ConnectionDescriptor } from './connection';
import { parseStreamMessage } from './responses';
import {
  HitItemsPayload,
  ReconnectPayload,
  ReplaceCameraPayload,
  StartStreamPayload,
} from './types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';

type ResponseMessageHandler = (
  response: vertexvis.protobuf.stream.IStreamResponse
) => void;

type RequestMessageHandler = (
  request: vertexvis.protobuf.stream.IStreamRequest
) => void;

/**
 * The API client to interact with Vertex's streaming API.
 */
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

  /**
   * Initiates a websocket connection to Vertex's streaming API. Returns a
   * promise that resolves once the connection is established and can begin
   * accepting messages.
   *
   * @param descriptor A function that returns a description of how to establish
   * a WS connection.
   */
  public async connect(descriptor: ConnectionDescriptor): Promise<Disposable> {
    await this.websocket.connect(descriptor);
    this.messageSubscription = this.websocket.onMessage(message => {
      this.handleMessage(message);
    });

    return { dispose: () => this.dispose() };
  }

  /**
   * Closes any open WS connections and disposes of resources.
   */
  public dispose(): void {
    this.websocket.close();
    this.messageSubscription?.dispose();
  }

  /**
   * Adds a callback that is invoked when the client receives a request from the
   * server. Returns a `Disposable` that can be used to remove the listener.
   *
   * @param handler A handler function.
   */
  public onRequest(handler: RequestMessageHandler): Disposable {
    return this.onRequestDispatcher.on(handler);
  }

  /**
   * Sends a request to initiate a streaming session.
   *
   * The payload accepts an optional `frameCorrelationId` that will be sent
   * back on the frame that is associated to this request. Use `onRequest` to
   * add a callback that'll be invoked when the server sends a request to draw
   * the frame.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param data The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
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

  /**
   * Sends a request to reconnect to an existing streaming session.
   *
   * The payload accepts an optional `frameCorrelationId` that will be sent
   * back on the frame that is associated to this request. Use `onRequest` to
   * add a callback that'll be invoked when the server sends a request to draw
   * the frame.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param data The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
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

  /**
   * Sends a request to signal to the rendering pipeline that an interaction has
   * started. The rendering pipeline will use this as a hint to perform more
   * aggressive rendering optimizations at the expense of rendering quality.
   * Call `endInteraction` to signal to the rendering pipeline that an
   * interaction has finished.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param data The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
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

  /**
   * Sends a request to update the position of the scene's camera.
   *
   * The payload accepts an optional `frameCorrelationId` that will be sent
   * back on the frame that is associated to this request. Use `onRequest` to
   * add a callback that'll be invoked when the server sends a request to draw
   * the frame.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param data The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public replaceCamera(
    { camera }: ReplaceCameraPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ updateCamera: { camera } }, withResponse);
  }

  /**
   * Sends a request to perform hit detection.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param data The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
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

  /**
   * Sends a request to perform an alteration to a scene. Alterations include
   * changing item visibility and changing the materials of items.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param data The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public createSceneAlteration(
    payload: vertexvis.protobuf.stream.ICreateSceneAlterationPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest(
      {
        createSceneAlteration: payload,
      },
      withResponse
    );
  }

  /**
   * Sends a request to tell the rendering pipeline that an interaction has
   * ended.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param data The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
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

    if (messagePayload?.response != null) {
      this.onResponseDispatcher.emit(messagePayload.response);
    }

    if (messagePayload?.request != null) {
      this.onRequestDispatcher.emit(messagePayload.request);
    }
  }

  private onResponse(handler: ResponseMessageHandler): Disposable {
    return this.onResponseDispatcher.on(handler);
  }
}
