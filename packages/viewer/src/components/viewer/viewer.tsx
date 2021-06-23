import {
  Component,
  Element,
  h,
  Host,
  Prop,
  State,
  Watch,
  Method,
  Event,
  EventEmitter,
  Listen,
} from '@stencil/core';
import { ResizeObserver, ResizeObserverEntry } from '@juggle/resize-observer';
import { Config, parseConfig } from '../../lib/config';
import { Dimensions, Point } from '@vertexvis/geometry';
import classnames from 'classnames';
import {
  Disposable,
  UUID,
  Color,
  Async,
  EventDispatcher,
} from '@vertexvis/utils';
import { CommandRegistry } from '../../lib/commands/commandRegistry';
import {
  LoadableResource,
  SynchronizedClock,
  Viewport,
  Orientation,
} from '../../lib/types';
import { registerCommands } from '../../lib/commands/streamCommands';
import { InteractionHandler } from '../../lib/interactions/interactionHandler';
import { InteractionApi } from '../../lib/interactions/interactionApi';
import { TapEventDetails } from '../../lib/interactions/tapEventDetails';
import { MouseInteractionHandler } from '../../lib/interactions/mouseInteractionHandler';
import { MultiPointerInteractionHandler } from '../../lib/interactions/multiPointerInteractionHandler';
import { PointerInteractionHandler } from '../../lib/interactions/pointerInteractionHandler';
import { TouchInteractionHandler } from '../../lib/interactions/touchInteractionHandler';
import { TapInteractionHandler } from '../../lib/interactions/tapInteractionHandler';
import { FlyToPartKeyInteraction } from '../../lib/interactions/flyToPartKeyInteraction';
import { CommandFactory } from '../../lib/commands/command';
import { Environment } from '../../lib/environment';
import {
  WebsocketConnectionError,
  ViewerInitializationError,
  InteractionHandlerError,
  ComponentInitializationError,
  IllegalStateError,
} from '../../lib/errors';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import {
  WebSocketClientImpl,
  currentDateAsProtoTimestamp,
  protoToDate,
  toProtoDuration,
} from '@vertexvis/stream-api';
import { Scene } from '../../lib/scenes/scene';
import {
  getElementBackgroundColor,
  getElementBoundingClientRect,
} from './utils';
import {
  acknowledgeFrameRequests,
  CanvasDepthProvider,
  CanvasRenderer,
  createCanvasDepthProvider,
  createCanvasRenderer,
  measureCanvasRenderer,
} from '../../lib/rendering';
import { paintTime, Timing } from '../../lib/meters';
import { ViewerStreamApi } from '../../lib/stream/viewerStreamApi';
import {
  ViewerStreamAttributes,
  toProtoStreamAttributes,
  DepthBufferFrameType,
} from '../../lib/stream/streamAttributes';
import {
  upsertStorageEntry,
  getStorageEntry,
} from '../../lib/sessions/storage';
import { CustomError } from '../../lib/errors';
import { KeyInteraction } from '../../lib/interactions/keyInteraction';
import { BaseInteractionHandler } from '../../lib/interactions/baseInteractionHandler';
import {
  ColorMaterial,
  defaultSelectionMaterial,
  fromHex,
} from '../../lib/scenes/colorMaterial';
import { Frame } from '../../lib/types/frame';
import { mapFrameOrThrow, mapWorldOrientationOrThrow } from '../../lib/mappers';

const WS_RECONNECT_DELAYS = [0, 1000, 1000, 5000];

interface ConnectedStatus {
  jwt: string;
  status: 'connected';
}

interface ConnectingStatus {
  status: 'connecting';
}

interface DisconnectedStatus {
  status: 'disconnected';
}

/**
 * Internal state values for the component. Used to preserve values across live
 * reload refreshes.
 */
interface StateMap {
  streamWorldOrientation?: Orientation;
}

/** @internal */
export type ConnectionStatus =
  | ConnectingStatus
  | ConnectedStatus
  | DisconnectedStatus;

@Component({
  tag: 'vertex-viewer',
  styleUrl: 'viewer.css',
  shadow: true,
})
export class Viewer {
  /**
   * A URN of the scene resource to load when the component is mounted in the
   * DOM tree. The specified resource is a URN in the following format:
   *
   *  * `urn:vertexvis:scene:<sceneid>`
   */
  @Prop() public src?: string;

  /**
   * The Client ID associated with your Vertex Application.
   */
  @Prop() public clientId?: string;

  /**
   * Property used for internals or testing.
   *
   * @private
   */
  @Prop() public sessionId?: string;

  /**
   * An object or JSON encoded string that defines configuration settings for
   * the viewer.
   */
  @Prop() public config?: Config | string;

  /**
   * Sets the default environment for the viewer. This setting is used for
   * auto-configuring network hosts.
   *
   * Use the `config` property for manually setting hosts.
   *
   * @see Viewer.config
   */
  @Prop() public configEnv: Environment = 'platprod';

  /**
   * Enables or disables the default mouse and touch interactions provided by
   * the viewer. Enabled by default.
   */
  @Prop() public cameraControls = true;

  /**
   * Enables or disables the default keyboard shortcut interactions provided by
   * the viewer. Enabled by default, requires `cameraControls` being enabled.
   *
   */
  @Prop() public keyboardControls = true;

  /**
   * Enables or disables the default rotation interaction being changed to
   * rotate around the mouse down location.
   */
  @Prop() public rotateAroundTapPoint = false;

  /**
   * Specifies when a depth buffer is requested from rendering. Possible values
   * are:
   *
   * * `undefined`: A depth buffer is never requested.
   * * `final`: A depth buffer is only requested on the final frame.
   * * `all`: A depth buffer is requested for every frame.
   *
   * Depth buffers can increase the amount of data that's sent to a client and
   * can impact rendering performance. Values of `undefined` or `final` should
   * be used when needing the highest rendering performance.
   */
  @Prop() public depthBuffers?: DepthBufferFrameType;

  /**
   * Specifies the opacity, between 0 and 100, for an experimental ghosting
   * feature. When the value is non-zero, any scene items that are hidden will
   * be appear translucent.
   *
   * **Note:** This feature is experimental, and may cause slower frame rates.
   */
  @Prop() public experimentalGhostingOpacity = 0;

  /**
   * The default hex color or material to use when selecting items.
   */
  @Prop() public selectionMaterial:
    | string
    | ColorMaterial = defaultSelectionMaterial;

  /**
   * The last frame that was received, which can be used to inspect the scene
   * and camera information.
   */
  @Prop({ mutable: true }) public frame: Frame | undefined;

  /**
   * An object containing the stream attribute values sent to rendering. This
   * value is updated automatically when properties like `depthBuffers` are
   * set. You should not set this value directly, as it may be overridden.
   *
   * @readonly
   */
  @Prop({ mutable: true }) public streamAttributes: ViewerStreamAttributes = {};

  /**
   * Emits an event whenever the user taps or clicks a location in the viewer.
   * The event includes the location of the tap or click.
   */
  @Event() public tap!: EventEmitter<TapEventDetails>;

  /**
   * Emits an event whenever the user double taps or clicks a location in the viewer.
   * The event includes the location of the first tap or click.
   */
  @Event() public doubletap!: EventEmitter<TapEventDetails>;

  /**
   * Emits an event whenever the user taps or clicks a location in the viewer and the
   * configured amount of time passes without receiving a mouseup or touchend.
   * The event includes the location of the tap or click.
   */
  @Event() public longpress!: EventEmitter<TapEventDetails>;

  /**
   * Emits an event when a frame has been received by the viewer. The event
   * will include details about the drawn frame, such as the `Scene` information
   * related to the scene.
   */
  @Event() public frameReceived!: EventEmitter<Frame>;

  /**
   * Emits an event when a frame has been drawn to the viewer's canvas. The event
   * will include details about the drawn frame, such as the `Scene` information
   * related to the scene.
   */
  @Event() public frameDrawn!: EventEmitter<Frame>;

  /**
   * Emits an event when a provided oauth2 token is about to expire, or is about to expire,
   * causing issues with establishing a websocket connection, or performing API calls.
   */
  @Event() public tokenExpired!: EventEmitter<void>;

  /**
   * Emits an event when the connection status changes for the viewer
   */
  @Event() public connectionChange!: EventEmitter<ConnectionStatus>;

  /**
   * Emits an event when the scene is ready to be interacted with.
   */
  @Event() public sceneReady!: EventEmitter<void>;

  /**
   * Used for internals or testing.
   *
   * @private
   */
  @Event() public sessionidchange!: EventEmitter<string>;

  @Event() public dimensionschange!: EventEmitter<Dimensions.Dimensions>;

  @State() private dimensions?: Dimensions.Dimensions;
  @State() private hostDimensions?: Dimensions.Dimensions;
  @State() private errorMessage?: string;

  /**
   * This stores internal state that you want to preserve across live-reloads,
   * but shouldn't trigger a refresh if the data changes. Marking this with
   * @State to allow to preserve state across live-reloads.
   */
  @State() private stateMap: StateMap = {};

  @Element() private hostElement!: HTMLElement;

  private containerElement?: HTMLElement;
  private canvasElement?: HTMLCanvasElement;

  private stream!: ViewerStreamApi;

  private commands!: CommandRegistry;
  private canvasRenderer!: CanvasRenderer;
  private resource?: LoadableResource.LoadableResource;

  private lastFrame?: Frame;
  private mutationObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;

  private interactionHandlers: InteractionHandler[] = [];
  private interactionApi!: InteractionApi;
  private depthProvider!: CanvasDepthProvider;
  private tapKeyInteractions: KeyInteraction<TapEventDetails>[] = [];
  private baseInteractionHandler?: BaseInteractionHandler;

  private isResizing?: boolean;
  private isReconnecting?: boolean;
  private sceneViewId?: UUID.UUID;
  private streamSessionId?: UUID.UUID;
  private streamId?: UUID.UUID;
  private streamDisposable?: Disposable;
  private jwt?: string;
  private isStreamStarted = false;

  private internalFrameDrawnDispatcher = new EventDispatcher<Frame>();

  private clock?: SynchronizedClock;

  public constructor() {
    this.handleElementResize = this.handleElementResize.bind(this);
    this.streamSessionId = this.sessionId;
  }

  public componentDidLoad(): void {
    const ws = new WebSocketClientImpl();
    ws.onClose(() => this.handleWebSocketClose());

    this.stream = new ViewerStreamApi(ws, this.getConfig().flags.logWsMessages);
    this.setupStreamListeners();

    this.depthProvider = createCanvasDepthProvider();
    this.interactionApi = this.createInteractionApi();

    this.commands = new CommandRegistry(this.stream, () => this.getConfig());
    registerCommands(this.commands);

    this.calculateComponentDimensions();

    this.streamSessionId = this.sessionId;
    if (this.streamSessionId == null) {
      try {
        this.streamSessionId = getStorageEntry(
          'vertexvis:stream-sessions',
          (entry) => (this.clientId ? entry[this.clientId] : undefined)
        );
      } catch (e) {
        // Ignore the case where we can't access local storage for fetching a session
      }
    }

    if (this.src != null) {
      this.load(this.src);
    }

    if (this.cameraControls) {
      // default to pointer events if allowed by browser.
      if (window.PointerEvent != null) {
        const tapInteractionHandler = new TapInteractionHandler(
          'pointerdown',
          'pointerup',
          'pointermove',
          () => this.getConfig()
        );
        this.baseInteractionHandler = new PointerInteractionHandler(() =>
          this.getConfig()
        );
        this.registerInteractionHandler(this.baseInteractionHandler);
        this.registerInteractionHandler(new MultiPointerInteractionHandler());
        this.registerInteractionHandler(tapInteractionHandler);
      } else {
        const tapInteractionHandler = new TapInteractionHandler(
          'mousedown',
          'mouseup',
          'mousemove',
          () => this.getConfig()
        );

        // fallback to touch events and mouse events as a default
        this.baseInteractionHandler = new MouseInteractionHandler(() =>
          this.getConfig()
        );
        this.registerInteractionHandler(this.baseInteractionHandler);
        this.registerInteractionHandler(new TouchInteractionHandler());
        this.registerInteractionHandler(tapInteractionHandler);
      }
    }

    if (this.keyboardControls) {
      this.baseInteractionHandler?.setDefaultKeyboardControls(
        this.keyboardControls
      );

      this.registerTapKeyInteraction(
        new FlyToPartKeyInteraction(
          this.stream,
          () => this.getConfig(),
          () => this.getImageScale()
        )
      );
    }

    if (this.rotateAroundTapPoint) {
      this.baseInteractionHandler?.setPrimaryInteractionType('rotate-point');
    }

    this.updateStreamAttributesProp();
    this.registerSlotChangeListeners();
    this.injectViewerApi();
  }

  public connectedCallback(): void {
    this.resizeObserver = new ResizeObserver(this.handleElementResize);
  }

  public disconnectedCallback(): void {
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  public render(): h.JSX.IntrinsicElements {
    const canvasDimensions = this.getCanvasDimensions();
    return (
      <Host>
        <div class="viewer-container">
          <div
            ref={(ref) => (this.containerElement = ref)}
            class={classnames('canvas-container', {
              'enable-pointer-events ': window.PointerEvent != null,
            })}
          >
            <canvas
              ref={(ref) => (this.canvasElement = ref)}
              class="canvas"
              width={canvasDimensions != null ? canvasDimensions.width : 0}
              height={canvasDimensions != null ? canvasDimensions.height : 0}
              onContextMenu={(event) => event.preventDefault()}
            ></canvas>
            {this.errorMessage != null ? (
              <div class="error-message">{this.errorMessage}</div>
            ) : null}
          </div>
          <slot></slot>
        </div>
      </Host>
    );
  }

  /**
   * Internal API.
   *
   * @private
   */
  @Method()
  public async registerCommand<R, T>(
    id: string,
    factory: CommandFactory<R>,
    thisArg?: T
  ): Promise<Disposable> {
    return this.commands.register(id, factory, thisArg);
  }

  /**
   * @private For internal use only.
   */
  @Method()
  public async dispatchFrameDrawn(frame: Frame): Promise<void> {
    this.lastFrame = frame;
    this.frame = frame;
    this.internalFrameDrawnDispatcher.emit(frame);
    this.frameDrawn.emit(frame);
  }

  /**
   * Registers and initializes an interaction handler with the viewer. Returns a
   * `Disposable` that should be used to deregister the interaction handler.
   *
   * `InteractionHandler`s are used to build custom mouse and touch interactions
   * for the viewer. Use `<vertex-viewer camera-controls="false" />` to disable
   * the default camera controls provided by the viewer.
   *
   * @example
   * ```
   * class CustomInteractionHandler extends InteractionHandler {
   *   private element: HTMLElement;
   *   private api: InteractionApi;
   *
   *   public dispose(): void {
   *     this.element.removeEventListener('click', this.handleElementClick);
   *   }
   *
   *   public initialize(element: HTMLElement, api: InteractionApi): void {
   *     this.api = api;
   *     this.element = element;
   *     this.element.addEventListener('click', this.handleElementClick);
   *   }
   *
   *   private handleElementClick = (event: MouseEvent) => {
   *     api.tap({ x: event.clientX, y: event.clientY });
   *   }
   * }
   *
   * const viewer = document.querySelector("vertex-viewer");
   * viewer.registerInteractionHandler(new CustomInteractionHandler);
   * ```
   *
   * @param interactionHandler The interaction handler to register.
   * @returns {Promise<void>} A promise containing the disposable to use to
   *  deregister the handler.
   */
  @Method()
  public async registerInteractionHandler(
    interactionHandler: InteractionHandler
  ): Promise<Disposable> {
    this.interactionHandlers.push(interactionHandler);
    this.initializeInteractionHandler(interactionHandler);
    return {
      dispose: () => {
        const index = this.interactionHandlers.indexOf(interactionHandler);
        if (index !== -1) {
          this.interactionHandlers[index].dispose();
          this.interactionHandlers.splice(index, 1);
        }
      },
    };
  }

  /**
   * Registers a key interaction to be invoked when a specific set of
   * keys are pressed during a `tap` event.
   *
   * `KeyInteraction`s are used to build custom keyboard shortcuts for the
   * viewer using the current state of they keyboard to determine whether
   * the `fn` should be invoked. Use `<vertex-viewer keyboard-controls="false" />`
   * to disable the default keyboard shortcuts provided by the viewer.
   *
   * @example
   * ```
   * class CustomKeyboardInteraction extends KeyInteraction<TapEventDetails> {
   *   constructor(private viewer: HTMLVertexViewerElement) {}
   *
   *   public predicate(keyState: KeyState): boolean {
   *     return keyState['Alt'];
   *   }
   *
   *   public async fn(event: TapEventDetails) {
   *     const scene = await this.viewer.scene();
   *     const result = await scene.raycaster().hitItems(event.position);
   *
   *     if (result.hits.length > 0) {
   *       await scene
   *         .camera()
   *         .fitTo(q => q.withItemId(result.hits[0].itemId))
   *         .render();
   *     }
   *   }
   * }
   * ```
   *
   * @param keyInteraction - The `KeyInteraction` to register.
   */
  @Method()
  public async registerTapKeyInteraction(
    keyInteraction: KeyInteraction<TapEventDetails>
  ): Promise<void> {
    this.tapKeyInteractions = [...this.tapKeyInteractions, keyInteraction];
  }

  @Method()
  public async getInteractionHandlers(): Promise<InteractionHandler[]> {
    return this.interactionHandlers;
  }

  @Method()
  public async getBaseInteractionHandler(): Promise<
    BaseInteractionHandler | undefined
  > {
    return this.baseInteractionHandler;
  }

  @Method()
  public async getJwt(): Promise<string | undefined> {
    return this.jwt;
  }

  @Watch('src')
  public handleSrcChanged(scene: string | undefined): void {
    if (scene != null) {
      this.load(scene);
    } else {
      this.unload();
    }
  }

  /**
   * @ignore
   */
  @Watch('streamAttributes')
  protected handleStreamAttributesChanged(
    streamAttributes: ViewerStreamAttributes
  ): void {
    if (this.isStreamStarted) {
      this.stream.updateStream({
        streamAttributes: toProtoStreamAttributes(streamAttributes),
      });
    }
  }

  /**
   * @ignore
   */
  @Watch('rotateAroundTapPoint')
  protected handleRotateAboutTapPointChanged(): void {
    this.updateStreamAttributesProp();
  }

  /**
   * @ignore
   */
  @Watch('depthBuffers')
  protected handleDepthBuffersChanged(): void {
    this.updateStreamAttributesProp();
  }

  /**
   * @ignore
   */
  @Watch('experimentalGhostingOpacity')
  protected handleExperimentalGhostingOpacityChanged(): void {
    this.updateStreamAttributesProp();
  }

  /**
   * Loads the given scene into the viewer and return a `Promise` that
   * resolves when the scene has been loaded. The specified scene is
   * provided as a URN in the following format:
   *
   *  * `urn:vertexvis:scene:<sceneid>`
   *
   * @param urn The URN of the resource to load.
   */
  @Method()
  public async load(urn: string): Promise<void> {
    if (this.commands != null && this.dimensions != null) {
      const { resource, queries } = LoadableResource.fromUrn(urn);
      const isSameResource =
        this.resource != null &&
        this.resource.type === resource.type &&
        this.resource.id === resource.id;
      if (!isSameResource) {
        this.unload();
        this.resource = resource;
        await this.connectStreamingClient(
          this.resource,
          queries != null && queries.length > 0 ? queries[0] : undefined
        );
      }
    } else {
      throw new ViewerInitializationError(
        'Cannot load scene. Viewer has not been initialized.'
      );
    }
  }

  /**
   * Disconnects the websocket and removes any internal state associated with
   * the scene.
   */
  @Method()
  public async unload(): Promise<void> {
    if (this.streamDisposable != null) {
      this.isStreamStarted = false;
      this.streamId = undefined;
      this.streamDisposable.dispose();
      this.lastFrame = undefined;
      this.frame = undefined;
      this.sceneViewId = undefined;
      this.clock = undefined;
      this.errorMessage = undefined;
      this.resource = undefined;
      this.stateMap.streamWorldOrientation = undefined;
    }
  }

  /**
   * Returns an object that is used to perform operations on the `Scene` that's
   * currently being viewed. These operations include updating items,
   * positioning the camera and performing hit tests.
   */
  @Method()
  public async scene(): Promise<Scene> {
    return this.createScene();
  }

  /**
   * Returns `true` indicating that the scene is ready to be interacted with.
   */
  @Method()
  public async isSceneReady(): Promise<boolean> {
    return this.lastFrame != null && this.sceneViewId != null;
  }

  /**
   * @private Used for internal testing.
   */
  @Method()
  public async getStream(): Promise<ViewerStreamApi> {
    return this.stream;
  }

  @Listen('tap')
  private async handleTapEvent(
    event: CustomEvent<TapEventDetails>
  ): Promise<void> {
    this.tapKeyInteractions
      .filter((i) => i.predicate(event.detail))
      .forEach((i) => i.fn(event.detail));
  }

  /**
   * @private Used for internals or testing.
   */
  public getConfig(): Config {
    return parseConfig(this.configEnv, this.config);
  }

  /**
   * @private Used for testing.
   */
  public async handleWebSocketClose(): Promise<void> {
    if (this.isStreamStarted) {
      this.isStreamStarted = false;

      if (
        this.streamId != null &&
        this.resource != null &&
        !this.isReconnecting
      ) {
        await this.reconnectWebSocket(this.resource, this.streamId);
      }
    }
  }

  private async connectStreamingClient(
    resource: LoadableResource.LoadableResource,
    queryResource?: LoadableResource.QueryResource
  ): Promise<void> {
    if (this.resource == null) {
      this.errorMessage =
        'Unable to start streaming session. Resource must be provided.';
      console.error(
        'Unable to start streaming session. Resource must be provided.'
      );
      throw new ViewerInitializationError(this.errorMessage);
    }

    try {
      this.streamDisposable = await this.connectStream(resource);

      const { startStream } = await this.stream.startStream({
        streamKey: { value: this.resource.id },
        dimensions: this.dimensions,
        frameBackgroundColor: this.getBackgroundColor(),
        streamAttributes: toProtoStreamAttributes(this.streamAttributes),
        ...(queryResource?.type === 'scene-view-state' && {
          sceneViewStateId: { hex: queryResource.id },
        }),
      });

      const { streamId, sessionId, sceneViewId, jwt, worldOrientation } =
        startStream || {};

      this.jwt = jwt || undefined;
      this.emitConnectionChange({ status: 'connected', jwt: this.jwt || '' });

      if (this.clientId != null && sessionId?.hex != null) {
        this.streamSessionId = sessionId.hex;
        this.sessionidchange.emit(this.streamSessionId);
        try {
          upsertStorageEntry('vertexvis:stream-sessions', {
            [this.clientId]: this.streamSessionId,
          });
        } catch (e) {
          // Ignore the case where we can't access local storage for persisting a session
        }
      }

      if (sceneViewId?.hex != null) {
        this.sceneViewId = sceneViewId.hex;
        this.isStreamStarted = true;
      }
      if (streamId?.hex != null) {
        this.streamId = streamId.hex;
      }

      // Need to parse world orientation.
      this.stateMap.streamWorldOrientation = mapWorldOrientationOrThrow(
        worldOrientation
      );

      console.debug(
        `Stream connected [stream-id=${this.streamId}, scene-view-id=${this.sceneViewId}]`
      );

      await this.waitNextDrawnFrame(15 * 1000);

      this.sceneReady.emit();
    } catch (e) {
      this.emitConnectionChange({ status: 'disconnected' });
      if (e instanceof CustomError) {
        throw e;
      }

      if (this.lastFrame == null) {
        this.errorMessage = 'Unable to establish connection to Vertex.';
        console.error('Failed to establish WS connection', e);

        throw new WebsocketConnectionError(this.errorMessage, e);
      }
    }
  }

  private async connectStream(
    resource: LoadableResource.LoadableResource
  ): Promise<Disposable> {
    if (this.clientId == null) {
      console.warn(
        'Client ID not provided, using legacy path. A Client ID will be required in an upcoming release.'
      );
    }

    const connection = await this.commands.execute<Disposable>(
      'stream.connect',
      {
        clientId: this.clientId,
        sessionId: this.sessionId || this.streamSessionId,
        resource,
      }
    );
    this.synchronizeTime();
    this.canvasRenderer = measureCanvasRenderer(
      paintTime,
      createCanvasRenderer(),
      this.getConfig().flags.logFrameRate,
      (timings) => this.reportPerformance(timings)
    );
    if (this.containerElement != null) {
      this.resizeObserver?.observe(this.containerElement);
    }
    return connection;
  }

  private async synchronizeTime(): Promise<void> {
    try {
      const resp = await this.stream.syncTime({
        requestTime: currentDateAsProtoTimestamp(),
      });

      if (resp.syncTime?.replyTime != null) {
        const remoteTime = protoToDate(resp.syncTime.replyTime);
        if (remoteTime != null) {
          this.clock = new SynchronizedClock(remoteTime);
          console.debug(
            `Synchronized time [local-time=${this.clock.knownLocalTime.toISOString()}, remote-time=${this.clock.knownRemoteTime.toISOString()}]`
          );
        }
      }
    } catch (e) {
      console.error('Failed to synchronize clock', e);
    }
  }

  private async reconnectStreamingClient(
    resource: LoadableResource.LoadableResource,
    streamId: UUID.UUID,
    isReopen = false
  ): Promise<void> {
    try {
      this.streamDisposable?.dispose();
      this.clock = undefined;

      this.emitConnectionChange({ status: 'connecting' });

      this.streamDisposable = await this.connectStream(resource);
      const result = await this.stream.reconnect({
        streamId: { hex: streamId },
        dimensions: this.dimensions,
        frameBackgroundColor: this.getBackgroundColor(),
        streamAttributes: toProtoStreamAttributes(this.streamAttributes),
      });
      this.isStreamStarted = true;
      this.isReconnecting = false;

      this.jwt = result.reconnect?.jwt || undefined;

      this.emitConnectionChange({ status: 'connected', jwt: this.jwt || '' });

      console.debug(
        `Stream reconnected [stream-id=${this.streamId}, scene-view-id=${this.sceneViewId}]`
      );
    } catch (e) {
      this.emitConnectionChange({ status: 'disconnected' });
      if (e instanceof CustomError) {
        throw e;
      }

      const message = 'Unable to establish connection to Vertex.';
      if (!isReopen) {
        this.errorMessage = this.errorMessage || message;
        console.error('Failed to establish WS connection', e);
      }
      throw new WebsocketConnectionError(message, e);
    }
  }

  private async reconnectWebSocket(
    resource: LoadableResource.LoadableResource,
    streamId: UUID.UUID,
    attempt = 0
  ): Promise<void> {
    try {
      await this.reconnectStreamingClient(resource, streamId, true);
    } catch (e) {
      // Keep trying as failures are expected in loss of network connection.
      setTimeout(
        () => this.reconnectWebSocket(resource, streamId, attempt + 1),
        WS_RECONNECT_DELAYS[Math.min(attempt, WS_RECONNECT_DELAYS.length - 1)]
      );
    }
  }

  private emitConnectionChange(status: ConnectionStatus): void {
    if (status.status === 'connected') {
      // NOTE: Uncomment once FSS is deployed.
      // if (status.jwt.length === 0) {
      //   throw new MissingJWTError('JWT is empty');
      // }
    }
    this.connectionChange.emit(status);
  }

  private handleElementResize(entries: ResizeObserverEntry[]): void {
    const dimensionsHaveChanged =
      entries.length >= 0 &&
      this.dimensions != null &&
      !Dimensions.isEqual(entries[0].contentRect, this.dimensions);
    if (dimensionsHaveChanged && !this.isResizing) {
      this.isResizing = true;

      window.requestAnimationFrame(() => this.recalculateComponentDimensions());
    }
  }

  private registerSlotChangeListeners(): void {
    this.mutationObserver = new MutationObserver((_) => this.injectViewerApi());
    this.mutationObserver.observe(this.hostElement, {
      childList: true,
      subtree: true,
    });
  }

  private injectViewerApi(): void {
    function queryChildren(el: Element): HTMLElement[] {
      return Array.from(el.querySelectorAll('*'));
    }

    const children = queryChildren(this.hostElement);

    children
      .filter((node) => node.nodeName.startsWith('VERTEX-'))
      .reduce(
        (elements, element) => [
          ...elements,
          element,
          ...queryChildren(element),
        ],
        [] as Element[]
      )
      .forEach((node) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (node as any).viewer = this.hostElement;
      });
  }

  private async handleStreamRequest(
    request: vertexvis.protobuf.stream.IStreamRequest
  ): Promise<void> {
    if (request.drawFrame != null) {
      this.handleFrame(request.drawFrame);
    } else if (request.gracefulReconnection != null) {
      this.handleGracefulReconnect(request.gracefulReconnection);
    }
  }

  private handleGracefulReconnect(
    payload: vertexvis.protobuf.stream.IGracefulReconnectionPayload
  ): void {
    if (payload.streamId?.hex != null && this.resource != null) {
      this.isReconnecting = true;
      this.reconnectStreamingClient(this.resource, payload.streamId.hex);
    }
  }

  private async handleFrame(
    payload: vertexvis.protobuf.stream.IDrawFramePayload
  ): Promise<void> {
    const dimensions = this.getCanvasDimensions();
    const worldOrientation = this.stateMap.streamWorldOrientation;

    if (
      this.canvasElement != null &&
      dimensions != null &&
      worldOrientation != null
    ) {
      const canvas = this.canvasElement.getContext('2d');
      if (canvas != null) {
        this.frame = mapFrameOrThrow(worldOrientation)(payload);

        const data = {
          canvas,
          dimensions,
          frame: this.frame,
          viewport: Viewport.fromDimensions(
            this.getCanvasDimensions() || Dimensions.create(0, 0)
          ),
        };

        this.frameReceived.emit(this.frame);
        const drawnFrame = await this.canvasRenderer(data);
        this.dispatchFrameDrawn(drawnFrame);
      }
    }
  }

  private waitNextDrawnFrame(timeout?: number): Promise<Frame> {
    const frame = new Promise<Frame>((resolve) => {
      const disposable = this.internalFrameDrawnDispatcher.on((frame) => {
        resolve(frame);
        disposable.dispose();
      });
    });

    return timeout != null ? Async.timeout(timeout, frame) : frame;
  }

  private calculateComponentDimensions(): void {
    const maxPixelCount = 2073600;
    const bounds = this.getBounds();
    if (bounds?.width != null && bounds?.height != null) {
      const measuredViewport = Dimensions.create(bounds.width, bounds.height);
      const trimmedViewport = Dimensions.scaleFit(
        maxPixelCount,
        measuredViewport
      );

      this.hostDimensions = measuredViewport;
      this.dimensions =
        trimmedViewport != null
          ? Dimensions.create(trimmedViewport.width, trimmedViewport.height)
          : undefined;
    }
  }

  private recalculateComponentDimensions(): void {
    if (this.isResizing) {
      this.calculateComponentDimensions();
      this.isResizing = false;

      this.dimensionschange.emit(this.dimensions);

      if (this.isStreamStarted) {
        this.stream.updateDimensions({ dimensions: this.dimensions });
      }
    }
  }

  private reportPerformance(timings: Timing[]): void {
    if (this.isStreamStarted) {
      const payload = {
        timings: timings.map((t) => ({
          receiveToPaintDuration: toProtoDuration(t.duration),
        })),
      };
      this.stream.recordPerformance(payload, false);
    }
  }

  private setupStreamListeners(): void {
    this.stream.onRequest((msg) => this.handleStreamRequest(msg.request));
    this.stream.onRequest(
      acknowledgeFrameRequests(this.stream, () => this.clock)
    );
  }

  private initializeInteractionHandler(handler: InteractionHandler): void {
    if (this.canvasElement == null) {
      throw new InteractionHandlerError(
        'Cannot initialize interaction handler. Canvas element is undefined.'
      );
    }
    if (this.interactionApi == null) {
      throw new InteractionHandlerError(
        'Cannot initialize interaction handler. Canvas element is undefined.'
      );
    }
    handler.initialize(this.canvasElement, this.interactionApi);
  }

  private createInteractionApi(): InteractionApi {
    if (this.stream == null) {
      throw new ComponentInitializationError(
        'Cannot create interaction API. Component has not been initialized.'
      );
    }

    return new InteractionApi(
      this.stream,
      () => this.getConfig().interactions,
      () => this.createScene(),
      (point) => this.getDepth(point),
      this.tap,
      this.doubletap,
      this.longpress
    );
  }

  private createScene(): Scene {
    if (
      this.lastFrame == null ||
      this.sceneViewId == null ||
      this.stateMap.streamWorldOrientation == null
    ) {
      throw new IllegalStateError(
        'Cannot create scene. Frame has not been rendered or stream not initialized.'
      );
    }

    const selectionMaterial =
      typeof this.selectionMaterial === 'string'
        ? fromHex(this.selectionMaterial)
        : this.selectionMaterial;
    return new Scene(
      this.stream,
      this.lastFrame,
      mapFrameOrThrow(this.stateMap.streamWorldOrientation),
      () => this.getImageScale(),
      this.sceneViewId,
      selectionMaterial
    );
  }

  private async getDepth(point: Point.Point): Promise<number> {
    if (this.lastFrame != null && this.dimensions != null) {
      return await this.depthProvider({
        point,
        dimensions: this.dimensions,
        frame: this.lastFrame,
      });
    }

    return -1;
  }

  /**
   * This function is currently not in use, but will required
   * when we want to automatically configure the background color of
   * JPEG images.
   */
  private getBackgroundColor(): Color.Color | undefined {
    if (this.containerElement != null) {
      return getElementBackgroundColor(this.containerElement);
    }
  }

  private getBounds(): ClientRect | undefined {
    if (this.hostElement != null) {
      return getElementBoundingClientRect(this.hostElement);
    }
  }

  private getCanvasDimensions(): Dimensions.Dimensions | undefined {
    return this.getConfig().flags.letterboxFrames
      ? this.dimensions
      : this.hostDimensions;
  }

  private getImageScale(): Point.Point | undefined {
    const canvasDimensions = this.getCanvasDimensions();
    if (this.dimensions != null && canvasDimensions != null) {
      return Point.create(
        this.dimensions.width / canvasDimensions.width,
        this.dimensions.height / canvasDimensions.height
      );
    }
  }

  private updateStreamAttributesProp(): void {
    const depthBuffers = this.getDepthBufferStreamAttributesValue();
    this.streamAttributes = {
      depthBuffers: { enabled: depthBuffers != null, frameType: depthBuffers },
      experimentalGhosting: {
        enabled: this.experimentalGhostingOpacity > 0,
        opacity: this.experimentalGhostingOpacity,
      },
    };
  }

  private getDepthBufferStreamAttributesValue():
    | DepthBufferFrameType
    | undefined {
    const depthBuffer =
      this.depthBuffers ?? (this.rotateAroundTapPoint ? 'final' : undefined);
    return depthBuffer;
  }
}
