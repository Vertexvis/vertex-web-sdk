import { WebSocketClient } from './webSocketClient';
import { UUID } from '@vertexvis/utils';
import { Camera } from '@vertexvis/graphics3d';
import { Disposable, EventDispatcher } from '../utils';
import { Operation, LoadSceneStateOperation } from './operations';
import {
  FrameResponse,
  parseResponse,
  Response,
  JsonResponse,
} from './responses';
import { UrlProvider } from './url';
import {
  AttemptReconnect,
  isReconnectMessage,
  toReconnectMessage,
} from './reconnect';
import { BoundingBox, Dimensions } from '@vertexvis/geometry';

type ResponseHandler = (response: Response) => void;

export type AnimationEasing =
  | 'linear'
  | 'ease-out-cubic'
  | 'ease-out-quad'
  | 'ease-out-quart'
  | 'ease-out-sine'
  | 'ease-out-expo';

export class ImageStreamingClient {
  private onResponseDispatcher = new EventDispatcher<Response>();
  private messageSubscription?: Disposable;

  private isInteractive: Promise<boolean> = Promise.resolve(false);

  private isInteractiveResolve: VoidFunction;
  private isInteractiveTimeout: any;

  public constructor(
    private websocket: WebSocketClient = new WebSocketClient()
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

  public onResponse(handler: ResponseHandler): Disposable {
    return this.onResponseDispatcher.on(handler);
  }

  public loadSceneState(
    data: Omit<LoadSceneStateOperation, 'type' | 'operationId'>
  ): Promise<FrameResponse> {
    const op = {
      ...data,
      type: 'LoadSceneStateOperation',
      operationId: UUID.create(),
    };
    return this.send(op);
  }

  public beginInteraction(): Promise<FrameResponse> {
    const op = {
      type: 'BeginInteractionOperation',
      operationId: UUID.create(),
    };

    clearTimeout(this.isInteractiveTimeout);
    this.initializeInteractive();

    return this.send(op);
  }

  public endInteraction(): Promise<FrameResponse> {
    const op = { type: 'EndInteractionOperation', operationId: UUID.create() };

    this.isInteractiveTimeout = setTimeout(this.resetInteractive, 2000);

    return this.send(op);
  }

  public flyToCamera(
    camera: Camera.Camera,
    bounds: BoundingBox.BoundingBox,
    durationInMs: number,
    easing: AnimationEasing = 'linear'
  ): Promise<FrameResponse> {
    const op = {
      type: 'FlyToCameraOperation',
      operationId: UUID.create(),
      camera,
      bounds,
      duration: durationInMs,
      easing,
    };

    return this.send(op);
  }

  public replaceCamera(camera: Camera.Camera): Promise<FrameResponse> {
    const op = {
      type: 'ReplaceCameraOperation',
      operationId: UUID.create(),
      camera,
    };
    return this.send(op);
  }

  public resizeStream(
    dimensions: Dimensions.Dimensions
  ): Promise<FrameResponse> {
    const op = {
      type: 'ResizeImageStreamOperation',
      operationId: UUID.create(),
      ...dimensions,
    };
    return this.send(op);
  }

  /**
   * @private Used for internals or testing.
   */
  public async reopen(
    message: AttemptReconnect,
    currentTime?: number,
    startTime?: number,
    endTime?: number
  ): Promise<void> {
    const currentTimeUtcMs = currentTime || Date.now();
    const startTimeUtcMs =
      startTime || Date.parse(message.reconnectWindowStartTime);
    const endTimeUtcMs = endTime || Date.parse(message.reconnectWindowEndTime);

    await new Promise(resolve =>
      setTimeout(resolve, startTimeUtcMs - currentTimeUtcMs)
    );

    if (this.isInteractive != null) {
      await Promise.race([
        this.isInteractive,
        new Promise(resolve =>
          setTimeout(resolve, endTimeUtcMs - currentTimeUtcMs)
        ),
      ]);
    }

    this.websocket.close();
  }

  private send(operation: Operation): Promise<FrameResponse> {
    return new Promise(resolve => {
      const subscription = this.onResponse(response => {
        if (
          response.type === 'frame' &&
          response.frame.frameAttributes.operationIds.includes(
            operation.operationId
          )
        ) {
          resolve(response);
          subscription.dispose();
        }
      });
      this.websocket.send(JSON.stringify(operation));
    });
  }

  private handleMessage(message: MessageEvent): void {
    const response = parseResponse(message);

    if (isReconnectMessage(response)) {
      this.reopen(toReconnectMessage(response as JsonResponse));
    }

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
