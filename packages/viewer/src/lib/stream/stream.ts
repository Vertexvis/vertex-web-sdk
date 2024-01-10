import { Dimensions } from '@vertexvis/geometry';
import {
  ConnectionDescriptor,
  currentDateAsProtoTimestamp,
  Settings,
  StreamApi,
  StreamRequestError,
  WebSocketClient,
} from '@vertexvis/stream-api';
import {
  Async,
  Color,
  Disposable,
  EventDispatcher,
  Listener,
  Mapper,
  Objects,
  Uri,
} from '@vertexvis/utils';

import { Color3, StreamAttributes } from '../../interfaces';
import { Config, parseConfig } from '../config';
import {
  CustomError,
  SceneRenderError,
  WebsocketConnectionError,
} from '../errors';
import {
  fromPbFrameOrThrow,
  fromPbReconnectResponseOrThrow,
  fromPbRefreshTokenResponseOrThrow,
  fromPbStartStreamResponseOrThrow,
  fromPbSyncTimeResponseOrThrow,
  toPbRGBi,
  toPbStreamAttributes,
} from '../mappers';
import { acknowledgeFrameRequests } from '../rendering';
import { Token } from '../token';
import {
  Frame,
  LoadableResource,
  Orientation,
  SynchronizedClock,
} from '../types';
import { Resource, SuppliedIdQueryValue } from '../types/loadableResource';
import {
  Connected,
  Connecting,
  Reconnecting,
  ViewerStreamState,
} from './state';

type StreamResult = Omit<
  Connected,
  'type' | 'frame' | 'connection' | 'clock'
> & { frame: Frame | undefined };

interface FrameStreamOptions {
  /**
   * The number of seconds before the token expires, when the token will be
   * refreshed. Defaults to 30 seconds.
   */
  tokenRefreshOffsetInSeconds?: number;

  /**
   * Indicates if debug logs will be emitted for websocket messages.
   */
  loggingEnabled?: boolean;

  /**
   * The number of seconds after the host goes offline before a reconnect is
   * attempted.
   */
  offlineThresholdInSeconds?: number;

  /**
   * The number of seconds before we consider loading a scene failed.
   */
  loadTimeoutInSeconds?: number;
}

interface UpdateFields {
  dimensions?: ViewerStream['dimensions'];
  streamAttributes?: ViewerStream['streamAttributes'];
  frameBgColor?: ViewerStream['frameBgColor'];
  config?: ViewerStream['config'];
  clientId?: ViewerStream['clientId'];
  deviceId?: ViewerStream['deviceId'];
}

export class ViewerStream extends StreamApi {
  private static WS_RECONNECT_DELAYS = [0, 1000, 1000, 5000];

  private dimensions: Dimensions.Dimensions;
  private streamAttributes: StreamAttributes;
  private frameBgColor: Color3;
  private config: Config;
  private clientId: string | undefined;
  private deviceId: string | undefined;

  private state: ViewerStreamState = { type: 'disconnected' };
  public readonly stateChanged = new EventDispatcher<ViewerStreamState>();

  private options: Required<Omit<FrameStreamOptions, 'loggingEnabled'>>;

  public constructor(ws: WebSocketClient, opts: FrameStreamOptions = {}) {
    super(ws, { loggingEnabled: opts.loggingEnabled });

    this.dimensions = Dimensions.create(0, 0);
    this.streamAttributes = {};
    this.frameBgColor = Color.create(255, 255, 255);
    this.config = parseConfig('platprod');

    this.options = {
      tokenRefreshOffsetInSeconds: opts.tokenRefreshOffsetInSeconds ?? 30,
      offlineThresholdInSeconds: opts.offlineThresholdInSeconds ?? 30,
      loadTimeoutInSeconds: opts.loadTimeoutInSeconds ?? 15,
    };
  }

  public getState(): ViewerStreamState {
    return this.state;
  }

  public disconnect(): void {
    if (
      this.state.type !== 'disconnected' &&
      this.state.type !== 'connection-failed'
    ) {
      console.debug('Disconnecting websocket');
      this.state.connection.dispose();
      this.updateState({ type: 'disconnected' });
    }
  }

  public async load(
    urn: string,
    clientId: string | undefined,
    deviceId: string | undefined,
    config: Config = parseConfig('platprod')
  ): Promise<void> {
    this.clientId = clientId;
    this.deviceId = deviceId;
    this.config = config;

    if (this.state.type === 'disconnected') {
      return this.loadIfDisconnected(urn);
    } else if (this.state.type === 'connection-failed') {
      return this.loadIfDisconnected(urn);
    } else if (this.state.type === 'reconnecting') {
      return this.loadIfConnectingOrConnected(urn, this.state);
    } else if (this.state.type === 'connecting') {
      return this.loadIfConnectingOrConnected(urn, this.state);
    } else {
      return this.loadIfConnectingOrConnected(urn, this.state);
    }
  }

  public update(fields: UpdateFields): void {
    this.frameBgColor = fields.frameBgColor
      ? fields.frameBgColor
      : this.frameBgColor;

    if (fields.dimensions != null && fields.dimensions !== this.dimensions) {
      this.dimensions = fields.dimensions;
      this.ifState('connected', () =>
        this.updateDimensions({ dimensions: this.getDimensions() })
      );
    }

    if (
      fields.streamAttributes != null &&
      this.streamAttributes !== fields.streamAttributes
    ) {
      this.streamAttributes = fields.streamAttributes;
      this.ifState('connected', () =>
        this.updateStream({
          streamAttributes: toPbStreamAttributesOrThrow(this.streamAttributes),
        })
      );
    }
  }

  private async loadIfConnectingOrConnected(
    urn: string,
    state: Connected | Connecting | Reconnecting
  ): Promise<void> {
    const { resource: pResource, subResource: pSubResource } = state.resource;
    const resource = LoadableResource.fromUrn(urn);

    const hasResourceChanged = !Objects.isEqual(pResource, resource.resource);
    const hasSubResourceChanged = !Objects.isEqual(
      pSubResource,
      resource.subResource
    );
    const isConnecting =
      state.type === 'connecting' || state.type === 'reconnecting';
    const isConnected = state.type === 'connected';
    const suppliedIdQuery = resource.queries.find(
      (q) => q.type === 'supplied-id'
    ) as SuppliedIdQueryValue | undefined;

    if (hasResourceChanged || (isConnecting && hasSubResourceChanged)) {
      this.disconnect();
      return this.loadIfDisconnected(urn);
    } else if (
      isConnected &&
      hasSubResourceChanged &&
      resource.subResource?.type === 'scene-view-state'
    ) {
      const payload = {
        ...(resource.subResource.id != null
          ? { sceneViewStateId: { hex: resource.subResource.id } }
          : {}),
        ...(suppliedIdQuery != null
          ? { sceneViewStateSuppliedId: { value: suppliedIdQuery.id } }
          : {}),
      };

      await this.loadSceneViewState(payload);
      this.updateState({ ...state, resource });
    }
  }

  private async loadIfDisconnected(urn: string): Promise<void> {
    try {
      await this.connectWithNewStream(LoadableResource.fromUrn(urn));
    } catch (e) {
      if (e instanceof CustomError) {
        this.updateState({
          type: 'connection-failed',
          message: `Cannot load scene. ${e.message}`,
          error: e,
        });
      } else if (e instanceof StreamRequestError) {
        this.updateState({
          type: 'connection-failed',
          message: `Cannot load scene. Stream request failed to start stream.`,
          error: e,
        });
      } else {
        this.updateState({
          type: 'connection-failed',
          message: `Cannot load scene for unknown reason. See console logs.`,
          error: e,
        });
      }

      throw e;
    }
  }

  private connectWithNewStream(resource: Resource): Promise<void> {
    return this.openWebsocketStream(resource, 'connecting', () =>
      this.requestNewStream(resource)
    );
  }

  private connectToExistingStream(state: Connected): Promise<void> {
    return this.openWebsocketStream(
      state.resource,
      'reconnecting',
      () => this.requestReconnectStream(state),
      { maxRetries: Number.POSITIVE_INFINITY }
    );
  }

  private async openWebsocketStream(
    resource: Resource,
    type: Connecting['type'] | Reconnecting['type'],
    requestStream: () => Promise<StreamResult>,
    { maxRetries = 3 }: { maxRetries?: number } = {}
  ): Promise<void> {
    const descriptor = getWebsocketDescriptor(
      getWebsocketUri(
        this.config,
        resource.resource,
        this.clientId,
        this.deviceId
      )
    );
    console.debug(`Initiating WS connection [uri=${descriptor.url}]`);

    const controller = new AbortController();
    const settings = getStreamSettings(this.config);
    this.updateState({
      type,
      resource,
      connection: {
        dispose: () => {
          this.dispose();
          controller.abort();
        },
      },
    });

    const connection = await Async.abort(
      controller.signal,
      Async.retry(() => this.connect(descriptor, settings), {
        maxRetries,
        delaysInMs: ViewerStream.WS_RECONNECT_DELAYS,
      })
    ).catch((e) => {
      throw new WebsocketConnectionError(
        'Websocket connection failed.',
        e instanceof Error ? e : undefined
      );
    });

    if (!connection.aborted) {
      return this.requestNewOrExistingStream(
        resource,
        connection.result,
        requestStream
      );
    } else {
      this.updateState({ type: 'disconnected' });
    }
  }

  private async requestNewOrExistingStream(
    resource: Resource,
    connection: Disposable,
    requestStream: () => Promise<StreamResult>
  ): Promise<void> {
    const pendingClock = this.requestClock();

    const stream = await requestStream();
    console.debug(
      `Stream connected [stream-id=${stream.streamId}, scene-id=${stream.sceneId}, scene-view-id=${stream.sceneViewId}]`
    );

    const onRequest = this.onRequest((msg) => {
      const req = msg.request.drawFrame;
      if (req != null) {
        const frame = fromPbFrameOrThrow(stream.worldOrientation)(req);

        if (this.state.type === 'connected') {
          if (
            frame.depthBufferBytes !== null ||
            this.state.frame.temporalRefinementCorrelationId !==
              frame.temporalRefinementCorrelationId
          ) {
            this.updateState({
              ...this.state,
              frame: frame,
              fallbackDepthBufferBytes: frame.depthBufferBytes,
            });
          } else {
            this.updateState({
              ...this.state,
              frame: frame.copy({
                depthBufferBytes: this.state.fallbackDepthBufferBytes,
              }),
            });
          }
        }
      }
    });

    const reconnect = this.reconnectWhenNeeded();
    const refreshToken = this.refreshTokenWhenExpired(stream.token);
    const acknowledgeFrameRequests = this.acknowledgeFrameRequests();
    const frame =
      stream.frame == null
        ? await this.waitForFrame(
            stream.worldOrientation,
            this.options.loadTimeoutInSeconds
          )
        : stream.frame;
    const clock = await pendingClock;
    console.debug(
      `Synchronized clocks [local-time=${clock.knownLocalTime.toISOString()}, remote-time=${clock.knownRemoteTime.toISOString()}]`
    );

    this.updateState({
      type: 'connected',
      connection: {
        dispose: () => {
          reconnect.dispose();
          onRequest.dispose();
          refreshToken.dispose();
          acknowledgeFrameRequests.dispose();
          connection.dispose();
        },
      },
      resource,
      streamId: stream.streamId,
      deviceId: stream.deviceId,
      sceneId: stream.sceneId,
      sceneViewId: stream.sceneViewId,
      worldOrientation: stream.worldOrientation,
      token: stream.token,
      frame,
      clock,
      fallbackDepthBufferBytes: undefined,
    });
  }

  private async requestNewStream(resource: Resource): Promise<StreamResult> {
    const suppliedIdQuery = resource.queries.find(
      (q) => q.type === 'supplied-id'
    ) as SuppliedIdQueryValue | undefined;

    const res = fromPbStartStreamResponseOrThrow(
      await this.startStream({
        streamKey: { value: resource.resource.id },
        dimensions: this.getDimensions(),
        frameBackgroundColor: toPbColorOrThrow(this.frameBgColor),
        clientSupportsTemporalRefinement: true,
        streamAttributes: toPbStreamAttributesOrThrow(this.streamAttributes),
        sceneViewStateId:
          resource.subResource?.type === 'scene-view-state' &&
          resource.subResource.id != null
            ? { hex: resource.subResource.id }
            : undefined,
        sceneViewStateSuppliedId:
          resource.subResource?.type === 'scene-view-state' &&
          suppliedIdQuery != null
            ? { value: suppliedIdQuery.id }
            : undefined,
      })
    );

    return {
      resource: resource,
      streamId: res.streamId,
      sceneId: res.sceneId,
      sceneViewId: res.sceneViewId,
      deviceId: res.sessionId,
      token: res.token,
      worldOrientation: res.worldOrientation,
      frame: undefined,
      fallbackDepthBufferBytes: undefined,
    };
  }

  private async requestReconnectStream(
    state: Connected
  ): Promise<StreamResult> {
    const res = fromPbReconnectResponseOrThrow(
      await this.reconnect({
        streamId: { hex: state.streamId },
        dimensions: this.getDimensions(),
        frameBackgroundColor: toPbColorOrThrow(this.frameBgColor),
        streamAttributes: toPbStreamAttributesOrThrow(this.streamAttributes),
        clientSupportsTemporalRefinement: true,
      })
    );
    return { ...state, token: res.token };
  }

  private async requestClock(): Promise<SynchronizedClock> {
    const remoteTime = fromPbSyncTimeResponseOrThrow(
      await this.syncTime({
        requestTime: currentDateAsProtoTimestamp(),
      })
    );

    return new SynchronizedClock(remoteTime);
  }

  private reconnectWhenNeeded(): Disposable {
    const whenDisconnected = this.onClose(() => {
      if (this.state.type === 'connected') {
        this.closeAndReconnect(this.state);
      }
    });

    const whenRequested = this.onRequest((msg) => {
      const isReconnectMsg = msg.request.gracefulReconnection != null;
      if (isReconnectMsg && this.state.type === 'connected') {
        console.debug(
          'Received request for graceful reconnect. Closing connection and attempting reconnect.'
        );
        this.closeAndReconnect(this.state);
      }
    });

    const whenOffline = this.reconnectWhenOffline();

    return {
      dispose: () => {
        whenDisconnected.dispose();
        whenRequested.dispose();
        whenOffline.dispose();
      },
    };
  }

  private refreshTokenWhenExpired(token: Token): Disposable {
    let timer: number;

    const startTimer = (token: Token): void => {
      const { tokenRefreshOffsetInSeconds } = this.options;
      const ms = token.remainingTimeInMs(tokenRefreshOffsetInSeconds);

      timer = window.setTimeout(async () => {
        const res = await this.refreshToken();
        const newToken = fromPbRefreshTokenResponseOrThrow(res);
        startTimer(newToken);
        if (this.state.type === 'connected') {
          this.updateState({ ...this.state, token: newToken });
        }
      }, ms);
    };

    startTimer(token);

    return { dispose: () => clearTimeout(timer) };
  }

  private reconnectWhenOffline(): Disposable {
    let timer: number;

    const clearTimer = (): void => window.clearTimeout(timer);

    const restartTimer = (): void => {
      clearTimer();

      const delayInSec = this.options.offlineThresholdInSeconds;
      console.debug(
        `Detected that host is offline. Will attempt reconnect in ${delayInSec}s.`
      );

      timer = window.setTimeout(() => {
        if (this.state.type === 'connected') {
          this.closeAndReconnect(this.state);
        }
      }, delayInSec * 1000);
    };

    const handleOnline = (): void => {
      console.debug('Detected that host is online.');
      clearTimer();
    };

    const handleOffline = (): void => restartTimer();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return {
      dispose: () => {
        clearTimer();
        window.removeEventListener('offline', restartTimer);
        window.removeEventListener('online', clearTimer);
      },
    };
  }

  private closeAndReconnect(state: Connected): Promise<void> {
    state.connection.dispose();
    return this.connectToExistingStream(state);
  }

  private async waitForFrame(
    worldOrientation: Orientation,
    timeoutInSeconds: number
  ): Promise<Frame> {
    let disposable: Disposable | undefined;

    try {
      return await Async.timeout(
        timeoutInSeconds * 1000,
        new Promise<Frame>((resolve) => {
          disposable = this.onRequest((msg) => {
            try {
              const req = msg.request.drawFrame;
              if (req != null) {
                const frame = fromPbFrameOrThrow(worldOrientation)(req);
                resolve(frame);
              }
            } finally {
              disposable?.dispose();
            }
          });
        })
      );
    } catch (e) {
      throw new SceneRenderError(
        `Frame timed out after ${timeoutInSeconds / 1000}s`,
        e instanceof Error ? e : undefined
      );
    } finally {
      disposable?.dispose();
    }
  }

  private acknowledgeFrameRequests(): Disposable {
    return this.onRequest(
      acknowledgeFrameRequests(this, () =>
        this.state.type === 'connected' ? this.state.clock : undefined
      )
    );
  }

  private updateState(state: ViewerStreamState): void {
    if (this.state !== state) {
      this.state = state;
      this.stateChanged.emit(this.state);
    }
  }

  private getDimensions(): Dimensions.Dimensions {
    if (Dimensions.area(this.dimensions) === 0) {
      // Ensure we always request at least a 1-pixel frame, even if the dimensions
      // haven't been set higher than zero.
      return Dimensions.create(1, 1);
    }
    return this.dimensions;
  }

  private ifState<T>(
    state: ViewerStreamState['type'],
    f: () => T
  ): T | undefined {
    if (this.state.type === state) {
      return f();
    }
  }

  public onStateChanged(listener: Listener<ViewerStreamState>): Disposable {
    return this.stateChanged.on(listener);
  }
}

const toPbStreamAttributesOrThrow = Mapper.ifInvalidThrow(toPbStreamAttributes);
const toPbColorOrThrow = Mapper.ifInvalidThrow(toPbRGBi);

function getStreamSettings(config: Config): Settings {
  return {
    EXPERIMENTAL_frameDelivery: {
      ...config.EXPERIMENTAL_frameDelivery,
      rateLimitingEnabled: config.flags.throttleFrameDelivery,
    },
    EXPERIMENTAL_adaptiveRendering: {
      ...config.EXPERIMENTAL_adaptiveRendering,
      enabled: config.flags.adaptiveRendering,
    },
    EXPERIMENTAL_qualityOfService: {
      ...config.EXPERIMENTAL_qualityOfService,
    },
  };
}

function getWebsocketDescriptor(uri: Uri.Uri): ConnectionDescriptor {
  return {
    url: Uri.toString(uri),
    protocols: ['ws.vertexvis.com'],
  };
}

function getWebsocketUri(
  config: Config,
  resource: LoadableResource.LoadableResource,
  clientId?: string,
  deviceId?: string
): Uri.Uri {
  if (clientId != null) {
    return Uri.appendPath(
      Uri.toString(
        Uri.parseAndAddParams('/ws', {
          clientId,
          deviceId,
        })
      ),
      Uri.parse(config.network.renderingHost)
    );
  } else {
    return Uri.appendPath(
      `/stream-keys/${resource.id}/session`,
      Uri.parse(config.network.renderingHost)
    );
  }
}
