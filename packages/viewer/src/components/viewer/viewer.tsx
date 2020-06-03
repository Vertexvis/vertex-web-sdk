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
import { Dimensions, Rectangle, Vector3 } from '@vertexvis/geometry';
import {
  Response,
  FrameResponse,
} from '../../image-streaming-client/responses';
import { Disposable } from '../../utils';
import {
  FrameAttributes,
  ImageStreamingClient,
  fromEedcFrameAttributes,
  EedcFrameAttributes,
} from '../../image-streaming-client';
import { FrameStreamingClient } from '../../frame-streaming-client';
import { WebSocketClient } from '../../websocket-client';
import { Color, UUID } from '@vertexvis/utils';
import { CommandRegistry } from '../../commands/commandRegistry';
import {
  registerCommands as registerStreamCommands,
  LoadModelResponse,
} from '../../commands/streamCommands';
import { Scene as SceneResource, Resource } from '../../types';
import { registerCommands as registerFrameStreamCommands } from '../../commands/frameStreamCommands';
import { HttpClient, httpWebClient } from '@vertexvis/network';
import {
  VertexApiOptions,
  vertexApiClient,
  AuthToken,
} from '@vertexvis/vertex-api';
import {
  Credentials,
  parseCredentials,
  waitForTokenExpiry,
  credentialsAreExpired,
} from '../../credentials/credentials';
import { InteractionHandler } from '../../interactions/interactionHandler';
import { InteractionApi } from '../../interactions/interactionApi';
import { TapEventDetails } from '../../interactions/tapEventDetails';
import { MouseInteractionHandler } from '../../interactions/mouseInteractionHandler';
import { TouchInteractionHandler } from '../../interactions/touchInteractionHandler';
import { TapInteractionHandler } from '../../interactions/tapInteractionHandler';
import {
  SceneBuilder,
  httpSceneBuilderExecutor,
} from '../../scenes/sceneBuilder';
import {
  Scene,
  httpBulkBomOperationExecutor,
  httpPickExecutor,
} from '../../scenes/scene';
import { CommandFactory } from '../../commands/command';
import { Environment } from '../../config/environment';
import {
  ExpiredCredentialsError,
  WebsocketConnectionError,
  SceneRenderError,
  ViewerInitializationError,
  UnsupportedOperationError,
  InteractionHandlerError,
  ComponentInitializationError,
  ImageLoadError,
  IllegalStateError,
  InvalidResourceUrnError,
} from '../../errors';
import { vertexvis } from '@vertexvis/frame-stream-protos';
import { StreamingClient } from '../../streaming-client';

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
   * A URN of the model resource to load when the component is mounted in the
   * DOM tree. The specified resource is a URN in one of the following formats:
   *
   *  * `urn:vertexvis:eedc:file:<fileid>`
   *  * `urn:vertexvis:eedc:scenestate:<scenestateid>`
   *  * `urn:vertexvis:eedc:file?externalId=<externalId>`
   *  * `urn:vertexvis:platform:scene:<sceneid>`
   */
  @Prop() public model?: string;

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
  @Prop() public configEnv: Environment = 'prod';

  /**
   * @private Used internally for testing.
   */
  @Prop() public httpClient!: HttpClient.HttpClient;

  /**
   * A `Credentials` object or JSON encoded string of a `Credentials` object.
   * The viewer must set this property or a combination of
   * `credentialsClientId`, `credentialsToken` and `credentialsApiKey`. This
   * property will take precedence.
   */
  @Prop() public credentials?: Credentials | string;

  /**
   * The client ID for an Oauth2 credentials flow. `credentialsToken` must also
   * be set.
   */
  @Prop() public credentialsClientId?: string;

  /**
   * The token for an Oauth2 credentials flow. Property is ignored if
   * `credentialsClientId` has not been set.
   */
  @Prop() public credentialsToken?: string;

  /**
   * The api key for a user token credentials flow.
   */
  @Prop() public credentialsApiKey?: string;

  /**
   * Enables or disables the default mouse and touch interactions provided by
   * the viewer. Enabled by default.
   */
  @Prop() public cameraControls = true;

  /**
   * Emits an event whenever the user taps or clicks a location in the viewer.
   * The event includes the location of the tap or click, which can be used
   * to perform an operation on the bom item at that position.
   */
  @Event() public tap!: EventEmitter<TapEventDetails>;

  /**
   * Emits an event when a frame has been received by the viewer. The event
   * will include details about the drawn frame, such as the `Scene` information
   * related to the scene.
   */
  @Event() public frameReceived!: EventEmitter<
    FrameAttributes | EedcFrameAttributes
  >;

  /**
   * Emits an event when a frame has been drawn to the viewer's canvas. The event
   * will include details about the drawn frame, such as the `Scene` information
   * related to the scene.
   */
  @Event() public frameDrawn!: EventEmitter<
    FrameAttributes | EedcFrameAttributes
  >;

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
  private stream!: StreamingClient;
  private loadedSceneStateId?: Promise<UUID.UUID>;
  private loadedSceneId?: Promise<UUID.UUID>;
  private activeCredentials: Credentials = AuthToken.unauthorized();

  private eedcFrameAttributes?: EedcFrameAttributes;
  private imageAttributes?: vertexvis.protobuf.stream.IImageAttributes;
  private frameAttributes?: Pick<
    vertexvis.protobuf.stream.IFrameResult,
    'imageAttributes' | 'sceneAttributes' | 'sequenceNumber'
  >;
  private mutationObserver?: MutationObserver;
  private lastFrameNumber = 0;

  private interactionHandlers: InteractionHandler[] = [];
  private interactionApi!: InteractionApi;

  private isResizing?: boolean;

  public constructor() {
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  public componentDidLoad(): void {
    this.initializeCredentials();

    if (this.httpClient == null) {
      const options = (): VertexApiOptions => {
        const config = this.getConfig();
        return {
          baseUrl: config.network.apiHost,
          auth: this.activeCredentials,
        };
      };
      this.httpClient = vertexApiClient(options, httpWebClient());
    }

    const config = this.getConfig();
    let registerCommands: (commands: CommandRegistry) => CommandRegistry;
    if (config.network.streamingClient === 'platform') {
      this.stream = new FrameStreamingClient(new WebSocketClient());
      this.stream.onResponse((response) =>
        this.handleFrameStreamResponse(response)
      );
      registerCommands = (commands) => {
        registerFrameStreamCommands(commands);
        return commands;
      };
    } else {
      this.stream = new ImageStreamingClient(new WebSocketClient());
      this.stream.onResponse((response) => this.handleStreamResponse(response));
      registerCommands = (commands) => {
        registerStreamCommands(commands);
        return commands;
      };
    }

    this.interactionApi = this.createInteractionApi();

    this.commands = new CommandRegistry(
      this.stream,
      () => this.httpClient,
      () => this.getConfig(),
      () => this.activeCredentials
    );
    this.commands = registerCommands(this.commands);

    this.calculateComponentDimensions();

    if (this.model != null) {
      this.load(this.model);
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
            ref={(ref) => (this.containerElement = ref)}
            class="canvas-container"
          >
            <canvas
              ref={(ref) => (this.canvasElement = ref)}
              class="canvas"
              width={this.dimensions != null ? this.dimensions.width : 0}
              height={this.dimensions != null ? this.dimensions.height : 0}
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

  @Watch('credentials')
  @Watch('credentialsToken')
  @Watch('credentialsClientId')
  @Watch('credentialsApiKey')
  public async handleCredentialsChanged(): Promise<void> {
    this.initializeCredentials();
  }

  /**
   * Internal API.
   *
   * @private
   */
  @Method()
  public async registerCommand<R, T, S extends StreamingClient>(
    id: string,
    factory: CommandFactory<R, S>,
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

  /**
   * Returns a `SceneBuilder` that is used to create a scene before viewing. A
   * `SceneBuilder` provides a fluent interface to specify what file or scene to
   * base the new scene off of, as well as operations to modify the new scene.
   *
   * @example
   *
   * const viewer = document.querySelector(".viewer");
   *
   * const newScene = await viewer.newScene();
   * newScene.from('urn:vertexvis:eedc:file:123)
   *   .highlight('#ff0000', s => s.withMetadata('Name', 'arm_SOLID_SOLIDS'))
   *   .execute()
   *   .then(scene => viewer.load(scene));
   */
  @Method()
  public async newScene(): Promise<SceneBuilder> {
    return new SceneBuilder(httpSceneBuilderExecutor(() => this.httpClient));
  }

  /**
   * Returns a `Scene` that contains methods for performing operations on the
   * loaded scene. If a scene has not been loaded, then this method will throw
   * an exception.
   *
   * @example
   *
   * const viewer = document.querySelector(".viewer");
   *
   * const scene = await viewer.scene();
   * scene
   *   .highlight('#ff0000', s => s.withMetadata('Name', 'arm_SOLID_SOLIDS'))
   *   .execute()
   */
  @Method()
  public async scene(): Promise<Scene> {
    if (this.commands == null) {
      throw new ViewerInitializationError('Viewer has not been initialized.');
    }

    if (this.loadedSceneStateId == null) {
      throw new IllegalStateError('Scene has not been loaded.');
    }

    const sceneStateId = await this.loadedSceneStateId;
    return new Scene(
      httpBulkBomOperationExecutor(() => this.httpClient, sceneStateId),
      httpPickExecutor(() => this.httpClient, sceneStateId),
      this.commands,
      () => this.eedcFrameAttributes
    );
  }

  @Watch('model')
  public handleModelChanged(model: string | undefined): void {
    if (model != null) {
      this.load(model);
    } else {
      this.unload();
    }
  }

  /**
   * Loads the given resource into the viewer and return a `Promise` that
   * resolves when the scene has been loaded. The specified resource is a URN in
   * one of the following formats:
   *
   *  * `urn:vertexvis:eedc:file:<fileid>`
   *  * `urn:vertexvis:eedc:scenestate:<scenestateid>`
   *  * `urn:vertexvis:eedc:file?externalId=<externalId>`
   *  * `urn:vertexvis:platform:scene:<sceneid>`
   *
   * @param resource The URN of the resource to load.
   */
  @Method()
  public async load(resource: string): Promise<void> {
    if (this.commands != null && this.dimensions != null) {
      if (Resource.isEedcUrn(resource)) {
        this.loadedSceneStateId = this.connectToEedcClient(resource);

        await this.loadedSceneStateId;
      } else if (Resource.isPlatformUrn(resource)) {
        this.loadedSceneId = this.connectToPlatformClient(resource);

        await this.loadedSceneId;
      } else {
        throw new InvalidResourceUrnError(
          `Provided URN must contain either the 'eedc' or 'platform' vertex scheme.`
        );
      }
    } else {
      throw new ViewerInitializationError(
        'Cannot load model. Viewer has not been initialized.'
      );
    }
  }

  @Method()
  public async getFrameAttributes(): Promise<EedcFrameAttributes | undefined> {
    return this.eedcFrameAttributes;
  }

  /**
   * @private Used for internals or testing.
   */
  public getConfig(): Config {
    return parseConfig(this.configEnv, this.config);
  }

  /**
   * @private Used for internals or testing.
   */
  public getCredentials(): Credentials {
    return this.activeCredentials;
  }

  private connectToEedcClient(resource: string): Promise<string> {
    const backgroundColor = this.getBackgroundColor();

    return new Promise(async (resolve, reject) => {
      await this.connectToStreamingClient({ backgroundColor });

      try {
        const response = await this.commands.execute<LoadModelResponse>(
          'stream.load-model',
          resource,
          this.dimensions
        );
        resolve(response.sceneStateId);
      } catch (e) {
        reject(
          new SceneRenderError(
            'Error loading model. Could not load or render scene.',
            e
          )
        );
      }
    });
  }

  private connectToPlatformClient(resource: string): Promise<string> {
    const scene = SceneResource.fromPlatformUrn(resource);

    return new Promise(async (resolve) => {
      await this.connectToStreamingClient({ sceneId: scene.id });

      await this.commands.execute<vertexvis.protobuf.stream.IStreamResponse>(
        'stream.start',
        this.dimensions
      );
      resolve(scene.id);
    });
  }

  private async connectToStreamingClient(
    options: Record<string, any>
  ): Promise<void> {
    try {
      await this.commands.execute('stream.connect', options);
    } catch (e) {
      if (credentialsAreExpired(this.activeCredentials)) {
        this.errorMessage =
          'Error loading model. Could not open websocket due to the provided credentials being expired.';

        throw new ExpiredCredentialsError(
          'Error loading model. Could not open websocket due to the provided credentials being expired.',
          e
        );
      } else {
        this.errorMessage = 'Error loading model. Could not open websocket.';
        throw new WebsocketConnectionError(
          'Error loading model. Could not open websocket.',
          e
        );
      }
    }
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
      .forEach((result) => {
        (result as any).viewer = this.hostElement;
      });
  }

  private unload(): void {
    throw new UnsupportedOperationError('Unsupported operation.');
  }

  private handleStreamResponse(response: Response): void {
    if (response.type === 'frame') {
      this.handleFrameResponse(response);
    }
  }

  private handleFrameStreamResponse(
    response: vertexvis.protobuf.stream.IStreamResponse
  ): void {
    if (response.frame != null) {
      this.drawFrame(response.frame, response.frame.image);
    }
  }

  private async handleFrameResponse(response: FrameResponse): Promise<void> {
    this.frameReceived?.emit(response.frame.frameAttributes);

    const platformFrameAttributes = fromEedcFrameAttributes(
      response.frame.frameAttributes
    );
    const frameWasDrawn = await this.drawFrame(
      platformFrameAttributes,
      response.frame.imageBytes
    );

    if (frameWasDrawn) {
      this.frameAttributes = platformFrameAttributes;
      this.eedcFrameAttributes = response.frame.frameAttributes;
      this.frameDrawn?.emit(this.eedcFrameAttributes);
    }
  }

  private async drawFrame(
    frame: FrameAttributes,
    bytes: Uint8Array | Int8Array
  ): Promise<boolean> {
    const frameNumber = this.lastFrameNumber + 1;

    const image = await this.loadImageBytes(bytes);

    const isNewerFrame = frameNumber > this.lastFrameNumber;
    if (isNewerFrame) {
      this.lastFrameNumber = frameNumber;
      this.imageAttributes = frame.imageAttributes;
      this.frameAttributes = frame;

      this.drawImage(
        image,
        frame.imageAttributes.frameDimensions,
        frame.imageAttributes.imageRect,
        frame.imageAttributes.scaleFactor
      );
    }

    image.dispose();

    return isNewerFrame;
  }

  private drawImage(
    image: LoadedImage,
    sceneViewport: vertexvis.protobuf.stream.IDimensions,
    imagePosition: vertexvis.protobuf.stream.IRectangle,
    scaleFactor: number
  ): void {
    if (this.canvasElement != null) {
      const context = this.canvasElement.getContext('2d');

      if (context != null && this.dimensions != null) {
        const imageRect = vertexvis.protobuf.stream.Rectangle.fromObject(
          sceneViewport
        );
        const fitTo = Rectangle.fromDimensions(this.dimensions);
        const fit = Rectangle.containFit(fitTo, imageRect);

        const scaleX = fit.width / imageRect.width;
        const scaleY = fit.height / imageRect.height;

        const startXPos = imagePosition.x * scaleX;
        const startYPos = imagePosition.y * scaleY;

        context.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
        context.drawImage(
          image.image,
          startXPos,
          startYPos,
          image.image.width * scaleFactor,
          image.image.height * scaleFactor
        );
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
      return this.hostElement.getBoundingClientRect();
    }
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
    if (this.stream == null || this.httpClient == null) {
      throw new ComponentInitializationError(
        'Cannot create interaction API. Component has not been initialized.'
      );
    }

    const verifyAttributes = <T extends {}>(f: () => T): (() => T) => {
      return () => {
        if (this.frameAttributes == null && this.eedcFrameAttributes == null) {
          throw new IllegalStateError(
            'Cannot retrieve scene. Frame has not been rendered'
          );
        }

        return f();
      };
    };

    return new InteractionApi(
      this.stream,
      verifyAttributes(() =>
        this.frameAttributes != null &&
        this.frameAttributes.sceneAttributes != null
          ? this.stream.cameraToEedc(
              this.frameAttributes.sceneAttributes.camera
            )
          : this.eedcFrameAttributes?.scene.camera
      ),
      verifyAttributes(() =>
        this.frameAttributes != null
          ? (this.frameAttributes.imageAttributes
              ?.frameDimensions as Dimensions.Dimensions)
          : this.eedcFrameAttributes?.scene.viewport
      ),
      verifyAttributes(() =>
        this.frameAttributes != null
          ? 45
          : this.eedcFrameAttributes?.scene.camera.fovy
      ),
      this.tap
    );
  }

  /**
   * Initializes credential properties from `credentials-client-id`,
   * `credentials-token` and `credentials-api-key` component properties.
   */
  private initializeCredentials(): void {
    if (this.credentials == null) {
      if (this.credentialsClientId != null && this.credentialsToken != null) {
        this.activeCredentials = AuthToken.oauth2(
          this.credentialsClientId,
          this.credentialsToken
        );
      } else if (this.credentialsApiKey != null) {
        this.activeCredentials = AuthToken.apiKey(this.credentialsApiKey);
      }
    } else if (typeof this.credentials === 'string') {
      this.activeCredentials = parseCredentials(this.credentials);
    } else {
      this.activeCredentials = this.credentials;
    }

    if (this.activeCredentials.strategy !== 'unauthorized') {
      this.watchCredentialsExpiration();
    }
  }

  private async watchCredentialsExpiration(): Promise<void> {
    if (credentialsAreExpired(this.activeCredentials)) {
      throw new ExpiredCredentialsError(
        'Provided credentials are expired, please provide valid credentials.'
      );
    }

    try {
      await waitForTokenExpiry(this.activeCredentials, 5000);

      this.tokenExpired.emit();
    } catch (e) {
      console.debug(
        'Token provided did not have an expiration timestamp, so no token expiry warning event will be emitted.'
      );
    }
  }

  private getBackgroundColor(): Color.Color | undefined {
    if (this.containerElement != null) {
      const colorString = window.getComputedStyle(this.containerElement);
      return Color.fromCss(colorString.backgroundColor);
    }
  }
}
