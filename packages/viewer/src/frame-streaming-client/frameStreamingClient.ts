import { WebSocketClient, UrlProvider } from '../websocket-client';
import { parseResponse } from './responses';
import { vertexvis } from '@vertexvis/frame-stream-protos';
import { Disposable, EventDispatcher } from '../utils';
import { NoImplementationFoundError } from '../errors';
import { Camera } from '@vertexvis/graphics3d';

type ResponseHandler = (
  response: vertexvis.protobuf.stream.IStreamResponse
) => void;

export class FrameStreamingClient {
  private onResponseDispatcher = new EventDispatcher<
    vertexvis.protobuf.stream.IStreamResponse
  >();

  private messageSubscription?: Disposable;

  private isInteractive: Promise<boolean> = Promise.resolve(false);

  private isInteractiveResolve: VoidFunction;
  private isInteractiveTimeout: any;

  public constructor(
    private websocket: WebSocketClient = new WebSocketClient()
  ) {
    this.initializeInteractive = this.initializeInteractive.bind(this);
    this.resetInteractive = this.resetInteractive.bind(this);
  }

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
    return this.send({
      startStream: {
        ...data,
      },
    });
  }

  public beginInteraction(): Promise<vertexvis.protobuf.stream.IFrameResult> {
    throw new NoImplementationFoundError('Begin interaction not implemented.');
  }

  public replaceCamera(
    camera: Camera.Camera
  ): Promise<vertexvis.protobuf.stream.IFrameResult> {
    throw new NoImplementationFoundError('Replace camera not implemented.');
  }

  public endInteraction(): Promise<vertexvis.protobuf.stream.IFrameResult> {
    throw new NoImplementationFoundError('End interaction not implemented.');
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

  protected startInteractionTimer(): void {
    clearTimeout(this.isInteractiveTimeout);
    this.initializeInteractive();
  }

  protected stopInteractionTimer(): void {
    this.isInteractiveTimeout = setTimeout(this.resetInteractive, 2000);
  }

  private handleMessage(message: MessageEvent): void {
    const response = parseResponse(message.data);

    this.onResponseDispatcher.emit(response);
  }

  private initializeInteractive(): void {
    if (this.isInteractiveResolve == null) {
      this.isInteractive = new Promise(resolve => {
        this.isInteractiveResolve = resolve;
      });
    }
  }

  private resetInteractive(): void {
    if (this.isInteractiveResolve != null) {
      this.isInteractiveResolve();
    }
    this.isInteractiveResolve = null;
    this.isInteractive = Promise.resolve(false);
  }
}
