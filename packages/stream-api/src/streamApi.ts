import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, EventDispatcher, UUID } from '@vertexvis/utils';

import { ConnectionDescriptor } from './connection';
import { decode, encode } from './encoder';
import { StreamRequestError } from './errors';
import { appendSettingsToUrl, Settings } from './settings';
import { currentDateAsProtoTimestamp } from './time';
import {
  EventMessage,
  GetStencilBufferPayload,
  HitItemsPayload,
  LoadSceneViewStatePayload,
  ReconnectPayload,
  RecordPerformancePayload,
  ReplaceCameraPayload,
  RequestMessage,
  ResponseError,
  ResponseMessage,
  ResponseResult,
  StartStreamPayload,
  SyncTimePayload,
  UpdateCrossSectioningPayload,
  UpdateDimensionsPayload,
  UpdateStreamPayload,
} from './types';
import { WebSocketClient, WebSocketClientImpl } from './webSocketClient';

export type RequestMessageHandler = (msg: RequestMessage) => void;

export type ResponseMessageHandler = (msg: ResponseMessage) => void;

export type EventMessageHandler = (msg: EventMessage) => void;

export type CloseEventHandler = (evt: CloseEvent) => void;

export interface StreamApiOptions {
  loggingEnabled?: boolean;
}

/**
 * The API client to interact with Vertex's streaming API.
 */
export class StreamApi {
  private onResponseDispatcher = new EventDispatcher<ResponseMessage>();
  private onRequestDispatcher = new EventDispatcher<RequestMessage>();
  private onEventDispatcher = new EventDispatcher<EventMessage>();
  private messageSubscription?: Disposable;

  private opts: Required<StreamApiOptions>;

  public constructor(
    private websocket: WebSocketClient = new WebSocketClientImpl(),
    opts: StreamApiOptions = {}
  ) {
    this.opts = {
      loggingEnabled: opts.loggingEnabled ?? false,
    };
  }

  /**
   * Initiates a websocket connection to Vertex's streaming API. Returns a
   * promise that resolves once the connection is established and can begin
   * accepting messages.
   *
   * @param descriptor A function that returns a description of how to establish
   * a WS connection.
   * @param settings A configuration to use when initializing the WS connection.
   */
  public async connect(
    descriptor: ConnectionDescriptor,
    settings: Settings = {}
  ): Promise<Disposable> {
    const desc = {
      ...descriptor,
      url: appendSettingsToUrl(descriptor.url, settings),
    };
    await this.websocket.connect(desc);
    this.messageSubscription = this.websocket.onMessage((message) => {
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
   * Adds a callback that is invoked when the client receives an event from the
   * server. Returns a `Disposable` that can be used to remove the listener.
   *
   * @param handler - A handler function.
   */
  public onEvent(handler: EventMessageHandler): Disposable {
    return this.onEventDispatcher.on(handler);
  }

  /**
   * Adds a callback that is invoked when the websocket connection is closed.
   *
   * @param handler A handler function.
   */
  public onClose(handler: CloseEventHandler): Disposable {
    return this.websocket.onClose(handler);
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

  public async updateStream(
    payload: UpdateStreamPayload,
    withResponse = false
  ): Promise<vertexvis.protobuf.stream.IUpdateStreamResult> {
    return this.sendRequest({ updateStream: payload }, withResponse);
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
   * Sends a request to update the position of the scene's camera as a fly operation
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
   * @param payload
   * @param withResponse
   */
  public flyTo(
    payload: vertexvis.protobuf.stream.IFlyToPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ flyTo: payload }, withResponse);
  }

  /**
   * Sends a request to update the dimensions of the frame.
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
  public updateDimensions(
    payload: UpdateDimensionsPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ updateDimensions: payload }, withResponse);
  }

  /**
   * Sends a request to update the cross sectioning planes of the frame.
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
  public updateCrossSectioning(
    payload: UpdateCrossSectioningPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ updateCrossSectioning: payload }, withResponse);
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
   * Sends a request to reset all overrides for a given scene and optionally to
   * reset the camera to that of the base scene.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param payload The payload of the request.
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public resetSceneView(
    payload: vertexvis.protobuf.stream.IResetViewPlayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ resetView: payload }, withResponse);
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
   * Sends a request to record performance timings that were measured in the
   * client. The server may use these timings as hints to optimize the rendering
   * performance to provide a better experience.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param payload The request payload
   * @param withResponse Indicates if the server should reply with a response.
   * Defaults to `true`.
   */
  public recordPerformance(
    payload: RecordPerformancePayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ recordPerformance: payload }, withResponse);
  }

  /**
   * Sends a request to update the current scene view with the state present
   * in the specified scene view state.
   *
   * Use `withResponse` to indicate if the server should reply with a response.
   * If `false`, the returned promise will complete immediately. Otherwise,
   * it'll complete when a response is received.
   *
   * @param payload
   * @param withResponse
   */
  public loadSceneViewState(
    payload: LoadSceneViewStatePayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ loadSceneViewState: payload }, withResponse);
  }

  /**
   * Sends a request to get a stencil buffer image for the current scene view.
   */
  public getStencilBuffer(
    payload: GetStencilBufferPayload,
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ getStencilBuffer: payload }, withResponse);
  }

  /**
   * Sends a request to retrieve a new token. This token can be used to
   * authenticate with other Vertex services.
   *
   * @param withResponse Indicates if the server should reply with a response.
   * @returns A promise that completes with the refreshed token.
   */
  public refreshToken(
    withResponse = true
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.sendRequest({ refreshToken: {} }, withResponse);
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

  protected handleMessage(message: MessageEvent): void {
    const msg = decode(message.data);
    this.log('WS message received', msg);

    if (msg?.sentAtTime != null) {
      if (msg.response != null) {
        this.onResponseDispatcher.emit({
          sentAtTime: msg.sentAtTime,
          response: msg.response,
        });
      }

      if (msg.request != null) {
        this.onRequestDispatcher.emit({
          sentAtTime: msg.sentAtTime,
          request: msg.request,
        });
      }

      if (msg.event != null) {
        this.onEventDispatcher.emit({
          sentAtTime: msg.sentAtTime,
          event: msg.event,
        });
      }
    }
  }

  protected onResponse(handler: ResponseMessageHandler): Disposable {
    return this.onResponseDispatcher.on(handler);
  }

  protected log(msg: string, ...other: unknown[]): void {
    if (this.opts.loggingEnabled) {
      console.debug(msg, ...other);
    }
  }

  private sendRequest(
    req: vertexvis.protobuf.stream.IStreamRequest,
    withResponse: boolean
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    const sentAtTime = currentDateAsProtoTimestamp();
    if (withResponse) {
      const requestId = UUID.create();
      const request = { ...req, requestId: { value: requestId } };

      return new Promise((resolve, reject) => {
        const subscription = this.onResponse((msg) => {
          if (requestId === msg.response.requestId?.value) {
            if (msg.response.error == null) {
              resolve(msg.response);
            } else {
              const { message: summary, details } = msg.response.error;
              reject(
                new StreamRequestError(
                  requestId,
                  req,
                  summary?.value,
                  details?.value
                )
              );
            }
            subscription.dispose();
          }
        });
        this.sendMessage({ sentAtTime, request });
      });
    }
    this.sendMessage({ sentAtTime, request: req });
    return Promise.resolve({});
  }

  private sendMessage(msg: vertexvis.protobuf.stream.IStreamMessage): void {
    this.websocket.send(encode(msg));
    this.log('WS message sent', msg);
  }

  private sendResponse(
    response: vertexvis.protobuf.stream.IStreamResponse
  ): void {
    const sentAtTime = currentDateAsProtoTimestamp();
    this.websocket.send(encode({ sentAtTime, response }));
  }
}
