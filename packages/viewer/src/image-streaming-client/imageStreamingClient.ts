import { WebSocketClient } from '../websocket-client';
import { UUID } from '@vertexvis/utils';
import { Camera } from '@vertexvis/graphics3d';
import { Operation, LoadSceneStateOperation } from './operations';
import {
  FrameResponse,
  parseResponse,
  Response,
  JsonResponse,
} from './responses';
import {
  AttemptReconnect,
  isReconnectMessage,
  toReconnectMessage,
} from './reconnect';
import { BoundingBox, Dimensions } from '@vertexvis/geometry';
import { StreamingClient } from '../streaming-client';

export type AnimationEasing =
  | 'linear'
  | 'ease-out-cubic'
  | 'ease-out-quad'
  | 'ease-out-quart'
  | 'ease-out-sine'
  | 'ease-out-expo';

export class ImageStreamingClient extends StreamingClient<Operation, Response> {
  public constructor(websocket: WebSocketClient = new WebSocketClient()) {
    super(message => {
      const response = parseResponse(message);

      if (isReconnectMessage(response)) {
        this.reopen(toReconnectMessage(response as JsonResponse));
      }

      return response;
    }, websocket);

    this.endInteraction = this.endInteraction.bind(this);
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

    super.startInteractionTimer();

    return this.send(op);
  }

  public endInteraction(): Promise<FrameResponse> {
    const op = { type: 'EndInteractionOperation', operationId: UUID.create() };

    super.stopInteractionTimer();

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

  protected send(operation: Operation): Promise<FrameResponse> {
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
}
