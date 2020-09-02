import { WebSocketClient, WebSocketClientImpl } from './webSocketClient';
import { ConnectionDescriptor } from './connection';
import {
  HitItemsPayload,
  ReconnectPayload,
  ReplaceCameraPayload,
  StartStreamPayload,
  ResponseResult,
  ResponseError,
  RequestMessage,
  ResponseMessage,
  SyncTimePayload,
} from './types';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';
import { currentDateAsProtoTimestamp } from './time';
import { encode, decode } from './encoder';

export type RequestMessageHandler = (msg: RequestMessage) => void;

export type ResponseMessageHandler = (msg: ResponseMessage) => void;

/**
 * The API client to interact with Vertex's streaming API.
 */
export class StreamApi {
  private onResponseDispatcher = new EventDispatcher<ResponseMessage>();
  private onRequestDispatcher = new EventDispatcher<RequestMessage>();
  private messageSubscription?: Disposable;

  public constructor(
    private websocket: WebSocketClient = new WebSocketClientImpl()
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
   * @param payload The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public startStream(
    payload: StartStreamPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ startStream: payload }, withResponse);
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
   * @param payload The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public async reconnect(
    payload: ReconnectPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ reconnect: payload }, withResponse);
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
    return this.sendRequest({ beginInteraction: {} }, withResponse);
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
   * @param payload The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public replaceCamera(
    payload: ReplaceCameraPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ updateCamera: payload }, withResponse);
  }

  /**
   * Sends a request to perform hit detection.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param payload The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public hitItems(
    payload: HitItemsPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ hitItems: payload }, withResponse);
  }

  /**
   * Sends a request to perform an alteration to a scene. Alterations include
   * changing item visibility and changing the materials of items.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param payload The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public createSceneAlteration(
    payload: vertexvis.protobuf.stream.ICreateSceneAlterationPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ createSceneAlteration: payload }, withResponse);
  }

  /**
   * Sends a request to tell the rendering pipeline that an interaction has
   * ended.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public endInteraction(
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IBeginInteractionResult> {
    return this.sendRequest({ endInteraction: {} }, withResponse);
  }

  /**
   * Sends a request to sync the clocks between the client and server.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param payload The request payload.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public syncTime(
    payload: SyncTimePayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ syncTime: payload }, withResponse);
  }

  /**
   * Acknowledges a successful request by sending a reply back to the server
   * with an optional result body.
   *
   * @param reqId The ID of the received request.
   * @param result A result to reply with.
   */
  public replyResult(reqId: string, result: ResponseResult): void {
    this.sendResponse({ requestId: { value: reqId }, ...result });
  }

  /**
   * Acknowledges a failed request by sending a reply back to the server.
   *
   * @param reqId The ID of the received request.
   * @param error An error to reply with.
   */
  public replyError(reqId: string, error: ResponseError): void {
    this.sendResponse({ requestId: { value: reqId }, error });
  }

  private sendRequest(
    req: vertexvis.protobuf.stream.IStreamRequest,
    withResponse: boolean
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    if (withResponse) {
      const sentAtTime = currentDateAsProtoTimestamp();
      const requestId = UUID.create();
      const request = { ...req, requestId: { value: requestId } };

      return new Promise(resolve => {
        const subscription = this.onResponse(msg => {
          if (requestId === msg.response.requestId?.value) {
            resolve(msg.response);
            subscription.dispose();
          }
        });
        this.websocket.send(encode({ request, sentAtTime }));
      });
    }
    this.websocket.send(encode({ request: req }));
    return Promise.resolve({});
  }

  private sendResponse(
    response: vertexvis.protobuf.stream.IStreamResponse
  ): void {
    const sentAtTime = currentDateAsProtoTimestamp();
    this.websocket.send(encode({ response, sentAtTime }));
  }

  private handleMessage(message: MessageEvent): void {
    const msg = decode(message.data);

    if (msg?.sentAtTime != null && msg?.response != null) {
      this.onResponseDispatcher.emit({
        sentAtTime: msg.sentAtTime,
        response: msg.response,
      });
    }

    if (msg?.sentAtTime != null && msg?.request != null) {
      this.onRequestDispatcher.emit({
        sentAtTime: msg.sentAtTime,
        request: msg.request,
      });
    }
  }

  private onResponse(handler: ResponseMessageHandler): Disposable {
    return this.onResponseDispatcher.on(handler);
  }
}
