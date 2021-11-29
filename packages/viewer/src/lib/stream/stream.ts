import {
  ConnectionDescriptor,
  currentDateAsProtoTimestamp,
  Settings,
  StreamApi,
  WebSocketClient,
} from '@vertexvis/stream-api';
import {
  Async,
  Color,
  Disposable,
  EventDispatcher,
  Listener,
  Objects,
  Uri,
} from '@vertexvis/utils';
import { Config } from '../config';
import { InvalidResourceUrnError } from '../errors';
import {
  fromPbFrameOrThrow,
  fromPbReconnectResponseOrThrow,
  fromPbRefreshTokenResponseOrThrow,
  fromPbStartStreamResponseOrThrow,
  fromPbSyncTimeResponseOrThrow,
} from '../mappers';
import {
  Frame,
  LoadableResource,
  Orientation,
  SynchronizedClock,
} from '../types';
import { Resource } from '../types/loadableResource';
import { ViewerStreamApi } from './viewerStreamApi';
import { upsertStorageEntry } from '../sessions/storage';
import { Token } from '../token';
import { Dimensions } from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Connected, Connecting, FrameStreamState, Reconnecting } from './state';

type StreamResult = Omit<
  Connected,
  'type' | 'frame' | 'connection' | 'clock'
> & { frame: Frame | undefined };

type Provider<T> = () => T;

interface FrameStreamOptions {
  readonly logWsMessages?: boolean;
}

export class FrameStream {
  private static WS_RECONNECT_DELAYS = [0, 1000, 1000, 5000];

  private state: FrameStreamState = { type: 'disconnected' };
  private stateChanged = new EventDispatcher<FrameStreamState>();

  private streamApi: StreamApi;

  public constructor(
    private readonly ws: WebSocketClient,
    private readonly clientIdProvider: Provider<string>,
    private readonly sessionIdProvider: Provider<string>,
    private readonly configProvider: Provider<Config>,
    private readonly dimensionsProvider: Provider<Dimensions.Dimensions>,
    private readonly streamAttributesProvider: Provider<vertexvis.protobuf.stream.IStreamAttributes>,
    private readonly frameBackgroundColorProvider: Provider<Color.Color>,
    options: FrameStreamOptions = {}
  ) {
    this.streamApi = new ViewerStreamApi(ws, options.logWsMessages);
  }

  public load(urn: string): Promise<void> {
    if (this.state.type === 'disconnected') {
      return this.loadIfDisconnected(urn);
    } else if (this.state.type === 'reconnecting') {
      return this.loadIfDisconnected(urn);
    } else if (this.state.type === 'connecting') {
      return this.loadIfConnectingOrConnected(urn, this.state);
    } else if (this.state.type === 'connected') {
      return this.loadIfConnectingOrConnected(urn, this.state);
    }
  }

  private async loadIfConnectingOrConnected(
    urn: string,
    state: Connected | Connecting
  ): Promise<void> {
    const { resource: pResource, queries: pQueries } = state.resource;
    const resource = LoadableResource.fromUrn(urn);

    const hasResourceChanged = !Objects.isEqual(pResource, resource);
    const hasQueryChanged = !Objects.isEqual(pQueries, resource.queries);
    const hasQuery = resource.queries[0] != null;
    const isConnecting = state.type === 'connecting';
    const isConnected = state.type === 'connected';

    if (hasResourceChanged || (isConnecting && hasQueryChanged)) {
      this.disconnect();
      this.connectWithNewStream(state.resource);
    } else if (isConnected && hasQuery && hasQueryChanged) {
      await this.streamApi.loadSceneViewState({
        sceneViewStateId: { hex: resource.queries[0].id },
      });
    }
  }

  private connectWithNewStream(resource: Resource): Promise<void> {
    return this.connect(resource, 'connecting', 0, () =>
      this.requestNewStream(this.getClientId(), resource)
    );
  }

  private connectToExistingStream(state: Connected): Promise<void> {
    return this.connect(
      state.resource,
      'reconnecting',
      Number.POSITIVE_INFINITY,
      () => this.requestReconnectStream(state)
    );
  }

  private async connect(
    resource: Resource,
    type: Connecting['type'] | Reconnecting['type'],
    maxRetries: number,
    requestStream: () => Promise<StreamResult>,
    { maxAttempts = 0 }: { maxAttempts?: number } = {}
  ): Promise<void> {
    const clientId = this.getClientId();
    const sessionId = this.getSessionId();
    const config = this.getConfig();

    if (clientId == null) {
      console.warn(
        'Client ID not provided, using legacy path. A Client ID will be required in an upcoming release.'
      );
    }

    if (resource.resource.type === 'stream-key') {
      const descriptor = getWebsocketDescriptor(
        getWebsocketUri(config, resource.resource, clientId, sessionId)
      );
      console.debug(`Initiating WS connection [uri=${descriptor.url}]`);

      const settings = getStreamSettings(config);
      const connection = await Async.retry(
        () => this.streamApi.connect(descriptor, settings),
        { maxRetries, delaysInMs: FrameStream.WS_RECONNECT_DELAYS }
      );
      this.updateState({ type, resource, connection });
      const pendingClock = this.requestClock();

      const stream = await requestStream();
      console.debug(
        `Stream connected [stream-id=${stream.streamId}, scene-view-id=${stream.sceneViewId}]`
      );

      const onRequest = this.streamApi.onRequest((msg) => {
        const req = msg.request.drawFrame;
        if (req != null) {
          const frame = fromPbFrameOrThrow(stream.worldOrientation)(req);

          if (this.state.type === 'connected') {
            this.updateState({ ...this.state, frame });
          }
        }
      });

      const reconnect = this.reconnectWhenNeeded();
      const refreshToken = this.refreshTokenWhenExpired(stream.token);
      const frame =
        stream.frame == null
          ? await this.waitForFrame(stream.worldOrientation, 15000)
          : stream.frame;
      const clock = await pendingClock;
      console.debug(
        `Synchronized clocks [local-time=${clock.knownLocalTime.toISOString()}, remote-time=${clock.knownRemoteTime.toISOString()}]`
      );

      this.updateState({
        type: 'connected',
        connection: {
          dispose: () => {
            connection.dispose();
            onRequest.dispose();
            reconnect.dispose();
            refreshToken.dispose();
          },
        },
        resource,
        streamId: stream.streamId,
        sceneViewId: stream.sceneViewId,
        worldOrientation: stream.worldOrientation,
        token: stream.token,
        frame,
        clock,
      });
    } else {
      throw new InvalidResourceUrnError(
        `Cannot load resource. Invalid type ${resource.resource.type}`
      );
    }
  }

  private loadIfDisconnected(urn: string): Promise<void> {
    return this.connectWithNewStream(LoadableResource.fromUrn(urn));
  }

  public disconnect(): void {
    if (this.state.type !== 'disconnected') {
      console.debug('Disconnecting websocket');
      this.state.connection.dispose();
    }
  }

  private async requestNewStream(
    clientId: string | undefined,
    resource: Resource
  ): Promise<StreamResult> {
    const res = fromPbStartStreamResponseOrThrow(
      await this.streamApi.startStream({
        streamKey: { value: resource.resource.id },
        dimensions: this.getDimensions(),
        frameBackgroundColor: this.getFrameBackgroundColor(),
        streamAttributes: this.getStreamAttributes(),
        sceneViewStateId:
          resource.queries[0].type === 'scene-view-state'
            ? { hex: resource.queries[0].id }
            : undefined,
      })
    );

    if (clientId != null) {
      upsertStorageEntry('vertexvis:stream-sessions', {
        [clientId]: res.sessionId,
      });
    }

    return {
      resource: resource,
      streamId: res.streamId,
      sceneViewId: res.sceneViewId,
      token: res.token,
      worldOrientation: res.worldOrientation,
      frame: undefined,
    };
  }

  private async requestReconnectStream(
    state: Connected
  ): Promise<StreamResult> {
    const res = fromPbReconnectResponseOrThrow(
      await this.streamApi.reconnect({
        streamId: { hex: state.streamId },
        dimensions: this.getDimensions(),
        frameBackgroundColor: this.getFrameBackgroundColor(),
        streamAttributes: this.getStreamAttributes(),
      })
    );
    return { ...state, token: res.token };
  }

  private async requestClock(): Promise<SynchronizedClock> {
    const remoteTime = fromPbSyncTimeResponseOrThrow(
      await this.streamApi.syncTime({
        requestTime: currentDateAsProtoTimestamp(),
      })
    );

    return new SynchronizedClock(remoteTime);
  }

  private updateState(state: FrameStreamState): void {
    if (this.state !== state) {
      this.state = state;
      this.stateChanged.emit(this.state);
    }
  }

  private reconnectWhenNeeded(): Disposable {
    const whenDisconnected = this.ws.onClose(() => {
      if (this.state.type === 'connected') {
        this.closeAndReconnect(this.state);
      }
    });

    const whenRequested = this.streamApi.onRequest((msg) => {
      const isReconnectMsg = msg.request.gracefulReconnection != null;
      if (isReconnectMsg && this.state.type === 'connected') {
        this.closeAndReconnect(this.state);
      }
    });

    return {
      dispose: () => {
        whenDisconnected.dispose();
        whenRequested.dispose();
      },
    };
  }

  private closeAndReconnect(state: Connected): Promise<void> {
    state.connection.dispose();
    return this.connectToExistingStream(state);
  }

  private refreshTokenWhenExpired(token: Token): Disposable {
    let timer: number;

    const startTimer = (token: Token): void => {
      if (token.hasExpired()) {
        throw new Error('Cannot refresh token. Token has already expired.');
      }

      timer = window.setTimeout(async () => {
        const res = await this.streamApi.refreshToken();
        const newToken = fromPbRefreshTokenResponseOrThrow(res);
        startTimer(newToken);
        if (this.state.type === 'connected') {
          this.updateState({ ...this.state, token: newToken });
        }
      }, token.remainingTimeInMs());
    };

    startTimer(token);

    return { dispose: () => clearTimeout(timer) };
  }

  private async waitForFrame(
    worldOrientation: Orientation,
    timeout: number
  ): Promise<Frame> {
    let disposable: Disposable | undefined;

    try {
      return await Async.timeout(
        timeout,
        new Promise<Frame>((resolve) => {
          disposable = this.streamApi.onRequest((msg) => {
            try {
              const req = msg.request.drawFrame;
              if (req != null) {
                const frame = fromPbFrameOrThrow(worldOrientation)(req);
                resolve(frame);
              }
            } finally {
              disposable.dispose();
            }
          });
        })
      );
    } finally {
      disposable.dispose();
    }
  }

  public onStateChanged(listener: Listener<FrameStreamState>): Disposable {
    return this.stateChanged.on(listener);
  }

  private getConfig(): Config {
    return this.configProvider();
  }

  private getClientId(): string {
    return this.clientIdProvider();
  }

  private getSessionId(): string {
    return this.sessionIdProvider();
  }

  private getFrameBackgroundColor(): Color.Color {
    return this.frameBackgroundColorProvider();
  }

  private getDimensions(): Dimensions.Dimensions {
    return this.dimensionsProvider();
  }

  private getStreamAttributes(): vertexvis.protobuf.stream.IStreamAttributes {
    return this.streamAttributesProvider();
  }
}

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
  sessionId?: string
): Uri.Uri {
  if (clientId != null) {
    return Uri.appendPath(
      Uri.toString(
        Uri.parseAndAddParams('/ws', {
          clientId,
          sessionId,
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
