import { WebSocketClient, UrlProvider } from '../websocket-client';
import { Disposable, EventDispatcher } from '../utils';
import { Camera } from '@vertexvis/graphics3d';
import { NoImplementationFoundError } from '../errors';
import { vertexvis } from '@vertexvis/frame-stream-protos';

type ResponseHandler<T> = (response: T) => void;
type MessageParser<T> = (message: MessageEvent) => T;

export class StreamingClient<ReqT = any, RespT = any> {
  protected onResponseDispatcher = new EventDispatcher<RespT>();
  protected messageSubscription?: Disposable;

  protected isInteractive: Promise<boolean> = Promise.resolve(false);

  protected isInteractiveResolve: VoidFunction;
  protected isInteractiveTimeout: any;

  public constructor(
    protected messageParser: MessageParser<RespT>,
    protected websocket: WebSocketClient = new WebSocketClient()
  ) {
    this.endInteraction = this.endInteraction.bind(this);
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

  public onResponse(handler: ResponseHandler<RespT>): Disposable {
    return this.onResponseDispatcher.on(handler);
  }

  public cameraToPlatform(
    camera: Camera.CameraPosition
  ): vertexvis.protobuf.stream.ICamera {
    return {
      position: camera.position,
      lookAt: camera.lookat,
      up: camera.upvector,
    };
  }

  public cameraToEedc(
    camera: vertexvis.protobuf.stream.ICamera
  ): Camera.CameraPosition {
    return {
      position: {
        x: camera.position.x || 0,
        y: camera.position.y || 0,
        z: camera.position.z || 0,
      },
      lookat: {
        x: camera.lookAt.x || 0,
        y: camera.lookAt.y || 0,
        z: camera.lookAt.z || 0,
      },
      upvector: {
        x: camera.up.x || 0,
        y: camera.up.y || 0,
        z: camera.up.z || 0,
      },
    };
  }

  public beginInteraction(data?: any): Promise<RespT> {
    throw new NoImplementationFoundError(
      `No implementation found for 'beginInteraction'.`
    );
  }

  public endInteraction(data?: any): Promise<RespT> {
    throw new NoImplementationFoundError(
      `No implementation found for 'endInteraction'.`
    );
  }

  public replaceCamera(data?: any): Promise<RespT> {
    throw new NoImplementationFoundError(
      `No implementation found for 'replaceCamera'.`
    );
  }

  protected send(request: any): Promise<RespT> {
    return new Promise(resolve => resolve());
  }

  protected startInteractionTimer(): void {
    clearTimeout(this.isInteractiveTimeout);
    this.initializeInteractive();
  }

  protected stopInteractionTimer(): void {
    this.isInteractiveTimeout = setTimeout(this.resetInteractive, 2000);
  }

  private handleMessage(message: MessageEvent): void {
    const response = this.messageParser(message);

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
