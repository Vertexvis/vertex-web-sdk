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
} from '@stencil/core';
import ResizeObserver from 'resize-observer-polyfill';
import { Config, parseConfig } from '../../config/config';
import { Dimensions } from '@vertexvis/geometry';
import {
  Disposable,
  UUID,
  Color,
  Async,
  EventDispatcher,
} from '@vertexvis/utils';
import { CommandRegistry } from '../../commands/commandRegistry';
import { Frame, LoadableResource, SynchronizedClock } from '../../types';
import { registerCommands } from '../../commands/streamCommands';
import { InteractionHandler } from '../../interactions/interactionHandler';
import { InteractionApi } from '../../interactions/interactionApi';
import { TapEventDetails } from '../../interactions/tapEventDetails';
import { MouseInteractionHandler } from '../../interactions/mouseInteractionHandler';
import { TouchInteractionHandler } from '../../interactions/touchInteractionHandler';
import { TapInteractionHandler } from '../../interactions/tapInteractionHandler';
import { CommandFactory } from '../../commands/command';
import { Environment } from '../../config/environment';
import {
  WebsocketConnectionError,
  ViewerInitializationError,
  InteractionHandlerError,
  ComponentInitializationError,
  IllegalStateError,
} from '../../errors';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import {
  StreamApi,
  WebSocketClientImpl,
  currentDateAsProtoTimestamp,
  protoToDate,
  toProtoDuration,
} from '@vertexvis/stream-api';
import { Scene } from '../../scenes/scene';
import {
  getElementBackgroundColor,
  getElementBoundingClientRect,
} from './utils';
import {
  createStreamApiRenderer,
  acknowledgeFrameRequests,
  RemoteRenderer,
  CanvasRenderer,
  createCanvasRenderer,
  measureCanvasRenderer,
} from '../../rendering';
import * as Metrics from '../../metrics';
import { Timing } from '../../metrics';

const WS_CONNECT_GRACE_PERIOD = 5000;
const WS_RECONNECT_DELAYS = [0, 1000, 1000, 5000];

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
   * Emits an event whenever the user taps or clicks a location in the viewer.
   * The event includes the location of the tap or click.
   */
  @Event() public tap!: EventEmitter<TapEventDetails>;

  /**
   * Emits an event when a frame has been received by the viewer. The event
   * will include details about the drawn frame, such as the `Scene` information
   * related to the scene.
   */
  @Event() public frameReceived!: EventEmitter<Frame.Frame>;

  /**
   * Emits an event when a frame has been drawn to the viewer's canvas. The event
   * will include details about the drawn frame, such as the `Scene` information
   * related to the scene.
   */
  @Event() public frameDrawn!: EventEmitter<Frame.Frame>;

  /**
   * Emits an event when a provided oauth2 token is about to expire, or is about to expire,
   * causing issues with establishing a websocket connection, or performing API calls.
   */
  @Event() public tokenExpired!: EventEmitter<void>;

  @State() private dimensions?: Dimensions.Dimensions;
  @State() private errorMessage?: string;

  @Element() private hostElement!: HTMLElement;
  private containerElement?: HTMLElement;
  private canvasElement?: HTMLCanvasElement;

  private commands!: CommandRegistry;
  private stream!: StreamApi;
  private remoteRenderer!: RemoteRenderer;
  private canvasRenderer!: CanvasRenderer;
  private resource?: LoadableResource.LoadableResource;

  private lastFrame?: Frame.Frame;
  private mutationObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;

  private interactionHandlers: InteractionHandler[] = [];
  private interactionApi!: InteractionApi;

  private isResizing?: boolean;
  private isReconnecting?: boolean;
  private sceneViewId?: UUID.UUID;
  private streamId?: UUID.UUID;
  private streamDisposable?: Disposable;
  private isStreamStarted = false;

  private internalFrameDrawnDispatcher = new EventDispatcher<Frame.Frame>();

  private clock?: SynchronizedClock;

  public constructor() {
    this.handleElementResize = this.handleElementResize.bind(this);
  }

  public componentDidLoad(): void {
    const ws = new WebSocketClientImpl();
    ws.onClose(() => this.handleWebSocketClose());

    this.stream = new StreamApi(ws, this.getConfig().flags.logWsMessages);
    this.remoteRenderer = createStreamApiRenderer(this.stream);
    this.setupStreamListeners();

    this.interactionApi = this.createInteractionApi();

    this.commands = new CommandRegistry(this.stream, () => this.getConfig());
    registerCommands(this.commands);

    this.calculateComponentDimensions();

    if (this.src != null) {
      this.load(this.src);
    }

    if (this.cameraControls) {
      this.registerInteractionHandler(new MouseInteractionHandler());
      this.registerInteractionHandler(new TouchInteractionHandler());
    }

    this.registerInteractionHandler(new TapInteractionHandler());

    this.injectViewerApi();
  }

  public connectedCallback(): void {
    this.mutationObserver = new MutationObserver(() => this.injectViewerApi());
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.resizeObserver = new ResizeObserver(this.handleElementResize);
  }

  public disconnectedCallback(): void {
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="viewer-container">
          <div
            ref={ref => (this.containerElement = ref)}
            class="canvas-container"
          >
            <canvas
              ref={ref => (this.canvasElement = ref)}
              class="canvas"
              width={this.dimensions != null ? this.dimensions.width : 0}
              height={this.dimensions != null ? this.dimensions.height : 0}
              onContextMenu={event => event.preventDefault()}
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
  public dispatchFrameDrawn(frame: Frame.Frame): void {
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
   *
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
   *
   * @param interactionHandler The interaction handler to register.
   * @returns {Promise<void>} - A promise containing the disposable to use to
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

  @Method()
  public async getInteractionHandlers(): Promise<InteractionHandler[]> {
    return this.interactionHandlers;
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
      const loadableResource = LoadableResource.fromUrn(urn);
      const isSameResource =
        this.resource != null &&
        this.resource.type === loadableResource.type &&
        this.resource.id === loadableResource.id;
      if (!isSameResource) {
        this.unload();
        this.resource = loadableResource;
        await this.connectStreamingClient(this.resource);
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
      this.streamDisposable.dispose();
      this.lastFrame = undefined;
      this.sceneViewId = undefined;
      this.clock = undefined;
      this.errorMessage = undefined;
      this.resource = undefined;
    }
  }

  @Method()
  public async scene(): Promise<Scene> {
    return this.createScene();
  }

  @Method()
  public async getFrame(): Promise<Frame.Frame | undefined> {
    return this.lastFrame;
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
  public getStreamApi(): StreamApi {
    return this.stream;
  }

  private async connectStreamingClient(
    resource: LoadableResource.LoadableResource
  ): Promise<void> {
    try {
      this.streamDisposable = await this.connectStream(resource);

      const result = await this.stream.startStream({
        dimensions: this.dimensions,
        frameBackgroundColor: this.getBackgroundColor(),
      });

      if (result.startStream?.sceneViewId?.hex != null) {
        this.sceneViewId = result.startStream.sceneViewId.hex;
        this.isStreamStarted = true;
      }
      if (result.startStream?.streamId?.hex != null) {
        this.streamId = result.startStream.streamId.hex;
      }

      await this.waitNextDrawnFrame(15 * 1000);
    } catch (e) {
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
    const connection = await this.commands.execute<Disposable>(
      'stream.connect',
      {
        resource,
      }
    );
    this.synchronizeTime();
    this.canvasRenderer = measureCanvasRenderer(
      Metrics.paintTime,
      createCanvasRenderer(),
      timings => this.reportPerformance(timings)
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
        }
      }
    } catch (e) {
      console.error('Failed to synchronize clock', e);
    }
  }

  private async reconnectStreamingClient(
    resource: LoadableResource.LoadableResource,
    streamId: UUID.UUID,
    isReopen: boolean = false
  ): Promise<void> {
    try {
      this.streamDisposable?.dispose();
      this.clock = undefined;

      this.streamDisposable = await this.connectStream(resource);
      await this.stream.reconnect({
        streamId: { hex: streamId },
        dimensions: this.dimensions,
        frameBackgroundColor: this.getBackgroundColor(),
      });
      this.isStreamStarted = true;
      this.isReconnecting = false;
    } catch (e) {
      const message = 'Unable to establish connection to Vertex.';
      if (!isReopen) {
        this.errorMessage = message;
        console.error('Failed to establish WS connection', e);
      }
      throw new WebsocketConnectionError(message, e);
    }
  }

  private async reconnectWebSocket(
    resource: LoadableResource.LoadableResource,
    streamId: UUID.UUID,
    attempt: number = 0
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

  private injectViewerApi(): void {
    document
      .querySelectorAll(`[data-viewer="${this.hostElement.id}"]`)
      .forEach(result => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any).viewer = this.hostElement;
      });
  }

  private async handleWebSocketClose(): Promise<void> {
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
    if (this.canvasElement != null && this.dimensions != null) {
      const frame = Frame.fromProto(payload);
      const canvas = this.canvasElement.getContext('2d');
      const dimensions = this.dimensions;
      if (canvas != null) {
        const data = { canvas, dimensions, frame };

        this.frameReceived.emit(frame);
        const drawnFrame = await this.canvasRenderer(data);
        this.lastFrame = drawnFrame;
        this.dispatchFrameDrawn(drawnFrame);
      }
    }
  }

  private waitNextDrawnFrame(timeout?: number): Promise<Frame.Frame> {
    const frame = new Promise<Frame.Frame>(resolve => {
      const disposable = this.internalFrameDrawnDispatcher.on(frame => {
        resolve(frame);
        disposable.dispose();
      });
    });

    return timeout != null ? Async.timeout(timeout, frame) : frame;
  }

  private calculateComponentDimensions(): void {
    const maxViewport = Dimensions.square(1280);
    const bounds = this.getBounds();
    if (bounds?.width != null && bounds?.height != null) {
      const measuredViewport = Dimensions.create(bounds.width, bounds.height);
      const trimmedViewport = Dimensions.trim(maxViewport, measuredViewport);

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

      if (this.isStreamStarted) {
        this.stream.updateDimensions({ dimensions: this.dimensions });
      }
    }
  }

  private reportPerformance(timings: Timing[]): void {
    if (this.isStreamStarted) {
      const payload = {
        timings: timings.map(t => ({
          receiveToPaintDuration: toProtoDuration(t.duration),
        })),
      };
      this.stream.recordPerformance(payload, false);
    }
  }

  private setupStreamListeners(): void {
    this.stream.onRequest(msg => this.handleStreamRequest(msg.request));
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

    return new InteractionApi(this.stream, () => this.createScene(), this.tap);
  }

  private createScene(): Scene {
    if (this.lastFrame == null || this.sceneViewId == null) {
      throw new IllegalStateError(
        'Cannot create scene. Frame has not been rendered or stream not initialized.'
      );
    } else {
      return new Scene(
        this.stream,
        this.remoteRenderer,
        this.lastFrame,
        this.commands,
        this.sceneViewId
      );
    }
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
}
