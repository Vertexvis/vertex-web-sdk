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
import { Config, parseConfig } from '../../config/config';
import { Dimensions, Rectangle } from '@vertexvis/geometry';
import { Disposable, UUID, Color } from '@vertexvis/utils';
import { CommandRegistry } from '../../commands/commandRegistry';
import { Frame, LoadableResource } from '../../types';
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
  ImageLoadError,
  IllegalStateError,
} from '../../errors';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { StreamApi, WebSocketClient } from '@vertexvis/stream-api';
import { Scene } from '../../scenes/scene';
import {
  getElementBackgroundColor,
  getElementBoundingClientRect,
} from './utils';

interface LoadedImage extends Disposable {
  image: HTMLImageElement | ImageBitmap;
}

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
  private resource?: LoadableResource.LoadableResource;

  private lastFrame?: Frame.Frame;
  private mutationObserver?: MutationObserver;
  private lastFrameNumber?: number;

  private interactionHandlers: InteractionHandler[] = [];
  private interactionApi!: InteractionApi;

  private isResizing?: boolean;
  private sceneViewId?: UUID.UUID;
  private streamDisposable?: Disposable;

  public constructor() {
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  public componentDidLoad(): void {
    this.stream = new StreamApi(new WebSocketClient());
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
    window.addEventListener('resize', this.handleWindowResize);

    this.mutationObserver = new MutationObserver(() => this.injectViewerApi());
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  public disconnectedCallback(): void {
    window.removeEventListener('resize', this.handleWindowResize);

    this.mutationObserver?.disconnect();
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
    await this.unload();

    if (this.commands != null && this.dimensions != null) {
      this.resource = LoadableResource.fromUrn(urn);
      await this.connectStreamingClient(this.resource);
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
      this.lastFrameNumber = undefined;
      this.sceneViewId = undefined;
    }
  }

  @Method()
  public async scene(): Promise<Scene> {
    if (this.lastFrame != null && this.sceneViewId != null) {
      return new Scene(
        this.stream,
        this.lastFrame,
        this.commands,
        this.sceneViewId
      );
    } else {
      throw new IllegalStateError(
        'Cannot retrieve scene. Frame has not been rendered'
      );
    }
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
    this.streamDisposable = await this.connectStream(resource);

    const streamResponse = await this.stream.startStream({
      dimensions: this.dimensions,
      frameBackgroundColor: this.getBackgroundColor(),
    });

    if (streamResponse.startStream != null) {
      this.sceneViewId = streamResponse.startStream.sceneViewId.hex;
    }
  }

  private async connectStream(
    resource: LoadableResource.LoadableResource
  ): Promise<Disposable> {
    try {
      return await this.commands.execute('stream.connect', { resource });
    } catch (e) {
      this.errorMessage = 'Unable to maintain connection to Vertex';
      throw new WebsocketConnectionError(this.errorMessage, e);
    }
  }

  private async reconnectStreamingClient(
    resource: LoadableResource.LoadableResource,
    streamId: UUID.UUID
  ): Promise<void> {
    this.streamDisposable.dispose();
    this.lastFrameNumber = undefined;

    this.streamDisposable = await this.connectStream(resource);
    this.stream.reconnect({
      streamId: { hex: streamId },
      dimensions: this.dimensions,
      frameBackgroundColor: this.getBackgroundColor(),
    });
  }

  private handleWindowResize(event: UIEvent): void {
    if (!this.isResizing) {
      this.isResizing = true;

      window.requestAnimationFrame(() => this.recalculateComponentDimensions());
    }
  }

  private injectViewerApi(): void {
    document
      .querySelectorAll(`[data-viewer="${this.hostElement.id}"]`)
      .forEach(result => {
        (result as any).viewer = this.hostElement;
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
    this.reconnectStreamingClient(this.resource, payload.streamId.hex);
  }

  private async handleFrame(
    payload: vertexvis.protobuf.stream.IDrawFramePayload
  ): Promise<void> {
    const frame = Frame.fromProto(payload);
    const frameNumber = frame.sequenceNumber;
    this.frameReceived?.emit(frame);

    const image = await this.loadImageBytes(payload.image);

    if (this.lastFrameNumber == null || frameNumber > this.lastFrameNumber) {
      this.lastFrameNumber = frameNumber;
      this.lastFrame = frame;
      this.drawImage(image, frame);
    }

    image.dispose();
  }

  private drawImage(image: LoadedImage, frame: Frame.Frame): void {
    if (this.canvasElement != null) {
      const context = this.canvasElement.getContext('2d');

      if (context != null && this.dimensions != null) {
        const { imageAttributes } = frame;
        const imageRect = vertexvis.protobuf.stream.Rectangle.fromObject(
          imageAttributes.frameDimensions
        );
        const fitTo = Rectangle.fromDimensions(this.dimensions);
        const fit = Rectangle.containFit(fitTo, imageRect);

        const scaleX = fit.width / imageRect.width;
        const scaleY = fit.height / imageRect.height;

        const startXPos = imageAttributes.imageRect.x * scaleX;
        const startYPos = imageAttributes.imageRect.y * scaleY;

        context.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
        context.drawImage(
          image.image,
          startXPos,
          startYPos,
          image.image.width * imageAttributes.scaleFactor * scaleX,
          image.image.height * imageAttributes.scaleFactor * scaleY
        );

        this.frameDrawn.emit(frame);
      }
    }
  }

  private loadImageBytes(
    imageBytes: Int8Array | Uint8Array
  ): Promise<LoadedImage> {
    if (window.createImageBitmap != null) {
      return this.loadImageBytesAsImageBitmap(imageBytes);
    } else {
      return this.loadImageBytesAsImageElement(imageBytes);
    }
  }

  private loadImageBytesAsImageElement(
    imageData: Int8Array | Uint8Array
  ): Promise<LoadedImage> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([imageData]);
      const blobUrl = URL.createObjectURL(blob);

      const image = new Image();
      image.addEventListener('load', () => {
        resolve({ image, dispose: () => undefined });
        URL.revokeObjectURL(blobUrl);
      });
      image.addEventListener('error', () => {
        reject(new ImageLoadError('Failed to load image data'));
        URL.revokeObjectURL(blobUrl);
      });

      image.src = blobUrl;
    });
  }

  private async loadImageBytesAsImageBitmap(
    imageData: Int8Array | Uint8Array
  ): Promise<LoadedImage> {
    const blob = new Blob([imageData]);
    const bitmap = await window.createImageBitmap(blob);
    return { image: bitmap, dispose: () => bitmap.close() };
  }

  private calculateComponentDimensions(): void {
    const maxViewport = Dimensions.square(1280);
    const bounds = this.getBounds();
    const measuredViewport = Dimensions.create(bounds.width, bounds.height);

    const trimmedViewport = Dimensions.trim(maxViewport, measuredViewport);

    this.dimensions =
      trimmedViewport != null
        ? Dimensions.create(trimmedViewport.width, trimmedViewport.height)
        : undefined;
  }

  private recalculateComponentDimensions(): void {
    if (this.isResizing) {
      this.calculateComponentDimensions();
      this.isResizing = false;

      this.commands.execute('stream.resize-stream', {
        dimensions: this.dimensions,
      });
    }
  }

  private getBounds(): ClientRect | undefined {
    if (this.hostElement != null) {
      return getElementBoundingClientRect(this.hostElement);
    }
  }

  private setupStreamListeners(): void {
    this.stream.onRequest(request => this.handleStreamRequest(request));
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
      () => {
        if (this.lastFrame == null || this.sceneViewId == null) {
          throw new IllegalStateError(
            'Cannot retrieve scene. Frame has not been rendered or start stream has not yet responded'
          );
        }
        return new Scene(
          this.stream,
          this.lastFrame,
          this.commands,
          this.sceneViewId
        );
      },
      this.tap
    );
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
}
