import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { Dimensions, Point } from '@vertexvis/geometry';
import { toProtoDuration, WebSocketClientImpl } from '@vertexvis/stream-api';
import { Color, Disposable, EventDispatcher, UUID } from '@vertexvis/utils';
import classnames from 'classnames';

import {
  FeatureHighlightOptions,
  FeatureLineOptions,
  FrameType,
  SelectionHighlightingOptions,
  StreamAttributes,
} from '../../interfaces';
import { Config, parseConfig, PartialConfig } from '../../lib/config';
import { Cursor, CursorManager } from '../../lib/cursors';
import { cssCursor } from '../../lib/dom';
import { Environment } from '../../lib/environment';
import {
  ComponentInitializationError,
  IllegalStateError,
  InteractionHandlerError,
  ViewerInitializationError,
} from '../../lib/errors';
import {
  InteractionApiOrthographic,
  InteractionApiPerspective,
} from '../../lib/interactions';
import { BaseInteractionHandler } from '../../lib/interactions/baseInteractionHandler';
import { FlyToPartKeyInteraction } from '../../lib/interactions/flyToPartKeyInteraction';
import { FlyToPositionKeyInteraction } from '../../lib/interactions/flyToPositionKeyInteraction';
import { InteractionApi } from '../../lib/interactions/interactionApi';
import { InteractionHandler } from '../../lib/interactions/interactionHandler';
import { KeyInteraction } from '../../lib/interactions/keyInteraction';
import { MouseInteractionHandler } from '../../lib/interactions/mouseInteractionHandler';
import { MultiPointerInteractionHandler } from '../../lib/interactions/multiPointerInteractionHandler';
import { PointerInteractionHandler } from '../../lib/interactions/pointerInteractionHandler';
import { TapEventDetails } from '../../lib/interactions/tapEventDetails';
import { TapInteractionHandler } from '../../lib/interactions/tapInteractionHandler';
import { TouchInteractionHandler } from '../../lib/interactions/touchInteractionHandler';
import { fromPbFrameOrThrow } from '../../lib/mappers';
import { paintTime, Timing } from '../../lib/meters';
import {
  CanvasRenderer,
  createCanvasRenderer,
  measureCanvasRenderer,
} from '../../lib/rendering';
import { Scene } from '../../lib/scenes/scene';
import {
  getStorageEntry,
  StorageKeys,
  upsertStorageEntry,
} from '../../lib/storage';
import {
  Connected,
  Connecting,
  ConnectionFailed,
  Disconnected,
  ViewerStreamState,
} from '../../lib/stream/state';
import { ViewerStream } from '../../lib/stream/stream';
import {
  FrameCamera,
  Orientation,
  StencilBufferManager,
  Viewport,
} from '../../lib/types';
import { Frame } from '../../lib/types/frame';
import { FrameCameraType } from '../../lib/types/frameCamera';
import {
  getElementBackgroundColor,
  getElementBoundingClientRect,
} from './utils';

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
  cursorManager: CursorManager;
  interactionTarget?: HTMLElement;
  streamState: ViewerStreamState;
  streamListeners?: Disposable;
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
  @Element() private hostElement!: HTMLVertexViewerElement;

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
   * @internal
   */
  @Prop({ mutable: true }) public deviceId?: string;

  /**
   * An object or JSON encoded string that defines configuration settings for
   * the viewer.
   */
  @Prop() public config?: PartialConfig | string;

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
   * @internal
   */
  @Prop({ mutable: true }) public resolvedConfig?: Config;

  /**
   * Enables or disables the default mouse and touch interactions provided by
   * the viewer. Enabled by default.
   */
  @Prop() public cameraControls = true;

  /**
   * The type of camera model to represent the scene with. Can be either
   * `perspective` or `orthographic`, and defaults to `perspective`.
   */
  @Prop({ mutable: true, reflect: true }) public cameraType: FrameCameraType =
    'perspective';

  /**
   * Enables or disables the default keyboard shortcut interactions provided by
   * the viewer. Enabled by default, requires `cameraControls` being enabled.
   *
   */
  @Prop() public keyboardControls = true;

  /**
   * Enables or disables the default rotation interaction being changed to
   * rotate around the pointer down location.
   */
  @Prop() public rotateAroundTapPoint = true;

  /**
   * A token that can be used to make API calls to other Vertex services.
   *
   * @internal
   */
  @Prop({ mutable: true }) public token?: string;

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
  @Prop() public depthBuffers?: FrameType;

  /**
   * Specifies the opacity, between 0 and 100, for an experimental ghosting
   * feature. When the value is non-zero, any scene items that are hidden will
   * be appear translucent.
   *
   * **Note:** This feature is experimental, and may cause slower frame rates.
   */
  @Prop() public experimentalGhostingOpacity = 0;

  /**
   * Specifies whether to use the default lights for the scene. When false, default
   * lights are used. When true, no default lights are used, and the lights must
   * be specified separately.
   */
  @Prop() public noDefaultLights = false;

  /**
   * @private
   * @internal
   * Specifies experimental rendering options. For Vertex use only.
   */
  @Prop() public experimentalRenderingOptions = '';

  /**
   * Specifies if and how to render feature lines.
   */
  @Prop({ attribute: null }) public featureLines?: FeatureLineOptions;

  /**
   * Specifies the halo selection properties.
   * Parameter notes:
   *  lineWidth values supported currently are 0-5. This width is currently the value x2. For example, 1 will have a pixel width of 2.
   *  color is optional. This will be the color of the selected items in the viewer.
   *  opacity is also optional. The opacity will be applied to everything selected besides the highlighted outer line.
   */
  @Prop({ attribute: null })
  public selectionHighlighting?: SelectionHighlightingOptions;

  /**
   * Specifies how selected features should be highlighted.
   */
  @Prop({ attribute: null })
  public featureHighlighting?: FeatureHighlightOptions;

  /**
   * Specifies when a feature map is returned from rendering. Feature maps
   * include information about the surfaces, edges and cross sections that are
   * in a frame.
   *
   * Possible values are:
   *
   * * `undefined`: A feature map is never requested.
   * * `final`: A feature map is only requested on the final frame.
   * * `all`: A feature map is requested for every frame.
   *
   * Feature maps can increase the amount of data that's sent to a client and
   * can impact rendering performance. Values of `undefined` or `final` should
   * be used when needing the highest rendering performance.
   */
  @Prop() public featureMaps?: FrameType;

  /**
   * An optional value that will debounce frame updates when resizing
   * this viewer element.
   */
  @Prop() public resizeDebounce = 100;

  /**
   * The last frame that was received, which can be used to inspect the scene
   * and camera information.
   *
   * @readonly
   */
  @Prop({ mutable: true }) public frame: Frame | undefined;

  /**
   * @internal
   */
  @Prop({ mutable: true }) public stream?: ViewerStream;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public stencilBuffer: StencilBufferManager = new StencilBufferManager(
    this.hostElement
  );

  /**
   * Represents the current viewport of the viewer. The viewport represents the
   * dimensions of the canvas where a frame is rendered. It contains methods for
   * translating between viewport coordinates, frame coordinates and world
   * coordinates.
   */
  @Prop({ mutable: true })
  public viewport: Viewport = Viewport.fromDimensions(Dimensions.create(0, 0));

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
   * Emits an event when a frame is received with a different scene attribute.
   */
  @Event() public sceneChanged!: EventEmitter<void>;

  /**
   * Emits an event when the user has started an interaction.
   */
  @Event() public interactionStarted!: EventEmitter<void>;

  /**
   * Emits an event when the user hs finished an interaction.
   */
  @Event() public interactionFinished!: EventEmitter<void>;

  /**
   * Emits an event when the camera type changes.
   */
  @Event() public cameraTypeChanged!: EventEmitter<FrameCameraType>;

  /**
   * Used for internals or testing.
   *
   * @private
   */
  @Event() public deviceIdChange!: EventEmitter<string>;

  @Event() public dimensionschange!: EventEmitter<Dimensions.Dimensions>;

  @State() private dimensions?: Dimensions.Dimensions;
  @State() private hostDimensions?: Dimensions.Dimensions;
  @State() private errorMessage?: string;

  @State() private cursor?: Cursor;

  /**
   * This stores internal state that you want to preserve across live-reloads,
   * but shouldn't trigger a refresh if the data changes. Marking this with
   * @State to allow to preserve state across live-reloads.
   */
  @State() private stateMap: StateMap = {
    cursorManager: new CursorManager(),
    streamState: { type: 'disconnected' },
  };

  private containerElement?: HTMLElement;
  private canvasElement?: HTMLCanvasElement;

  private canvasRenderer!: CanvasRenderer;

  private mutationObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;
  private isResizing?: boolean;
  private isResizeUpdate?: boolean;

  private resizeTimer?: NodeJS.Timeout;

  private interactionHandlers: InteractionHandler[] = [];
  private defaultInteractionHandlerDisposables: Array<Disposable> = [];
  private tapHandlerDisposable?: Disposable;
  private interactionApi!: InteractionApi;
  private tapKeyInteractions: KeyInteraction<TapEventDetails>[] = [];
  private defaultTapKeyInteractions: KeyInteraction<TapEventDetails>[] = [];
  private baseInteractionHandler?: BaseInteractionHandler;

  private internalFrameDrawnDispatcher = new EventDispatcher<Frame>();

  public constructor() {
    this.handleElementResize = this.handleElementResize.bind(this);
  }

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.updateResolvedConfig();
    this.calculateComponentDimensions();

    this.resizeObserver = new ResizeObserver(this.handleElementResize);
    this.registerSlotChangeListeners();

    this.stream =
      this.stream ??
      new ViewerStream(new WebSocketClientImpl(), {
        loggingEnabled: this.getResolvedConfig().flags.logWsMessages,
      });
    this.addStreamListeners();

    this.updateStreamAttributes();
    this.stateMap.cursorManager.onChanged.on(() => this.handleCursorChanged());
  }

  /**
   * @ignore
   */
  protected componentDidLoad(): void {
    this.interactionApi = this.createInteractionApi();

    if (this.containerElement != null) {
      this.resizeObserver?.observe(this.containerElement);
    }

    if (this.src != null) {
      this.load(this.src).catch((e) => {
        console.error('Error loading scene', e);
      });
    }

    this.initializeDefaultInteractionHandlers();
    this.injectViewerApi();
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div
          class="viewer-container"
          style={{ cursor: cssCursor(this.cursor ?? '') }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div
            ref={(ref) => (this.containerElement = ref)}
            class={classnames('canvas-container', {
              'enable-pointer-events ': window.PointerEvent != null,
            })}
          >
            <canvas
              ref={(ref) => {
                this.canvasElement = ref;
                this.stateMap.interactionTarget = ref;
              }}
              class="canvas"
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
   * @internal
   */
  @Method()
  public async dispatchFrameDrawn(frame: Frame): Promise<void> {
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

  /**
   * The HTML element that will handle interaction events from the user. Used by
   * components to listen for interaction events from the same element as the
   * viewer. Note, this property maybe removed in the future when refactoring
   * our interaction handling.
   *
   * @internal
   * @deprecated Use `InteractionHandler`.
   */
  @Method()
  public async getInteractionTarget_DEPRECATED(): Promise<HTMLElement> {
    if (this.stateMap.interactionTarget != null) {
      return this.stateMap.interactionTarget;
    } else throw new Error('Interaction target is undefined.');
  }

  /**
   * Adds a cursor to the viewer, and displays it if the cursor has the highest
   * priority.
   *
   * Cursors are managed as a prioritized list. A cursor is displayed if it has
   * the highest priority or if the cursor is the most recently added cursor in
   * the set of cursors with the same priority.
   *
   * To remove a cursor, call `dispose()` on the returned disposable.
   *
   * @param cursor The cursor to add.
   * @param priority The priority of the cursor.
   * @returns A disposable that can be used to remove the cursor.
   * @see See {@link CursorManager} for constants to pass to `priority`.
   */
  @Method()
  public async addCursor(
    cursor: Cursor,
    priority?: number
  ): Promise<Disposable> {
    return this.stateMap.cursorManager.add(cursor, priority);
  }

  @Method()
  public async getInteractionHandlers(): Promise<InteractionHandler[]> {
    return this.interactionHandlers;
  }

  /**
   * @internal
   * @ignore
   */
  @Method()
  public async getKeyInteractions(): Promise<
    KeyInteraction<TapEventDetails>[]
  > {
    return this.tapKeyInteractions;
  }

  @Method()
  public async getBaseInteractionHandler(): Promise<
    BaseInteractionHandler | undefined
  > {
    return this.baseInteractionHandler;
  }

  /**
   * @deprecated Use `token`.
   */
  @Method()
  public async getJwt(): Promise<string | undefined> {
    return this.token;
  }

  @Watch('src')
  public handleSrcChanged(src: string | undefined): void {
    if (src != null) {
      this.load(src);
    } else {
      this.unload();
    }
  }

  /**
   * @ignore
   */
  @Watch('cameraControls')
  protected handleCameraControlsChanged(): void {
    this.initializeDefaultCameraInteractionHandlers();
  }

  /**
   * @ignore
   */
  @Watch('keyboardControls')
  protected handleKeyboardControlsChanged(): void {
    this.initializeDefaultKeyboardInteractionHandlers();
  }

  /**
   * @ignore
   */
  @Watch('rotateAroundTapPoint')
  protected handleRotateAboutTapPointChanged(): void {
    this.updateStreamAttributes();
    if (this.rotateAroundTapPoint) {
      this.baseInteractionHandler?.setPrimaryInteractionType('rotate-point');
    } else {
      this.baseInteractionHandler?.setPrimaryInteractionType('rotate');
    }
  }

  @Watch('cameraType')
  protected handleCameraTypeChanged(
    updatedCameraType: string,
    previousCameraType: string
  ): void {
    if (updatedCameraType !== previousCameraType) {
      this.updateCameraType();
    }
  }

  /**
   * @ignore
   */
  @Watch('depthBuffers')
  protected handleDepthBuffersChanged(): void {
    this.updateStreamAttributes();
  }

  /**
   * @ignore
   */
  @Watch('experimentalGhostingOpacity')
  protected handleExperimentalGhostingOpacityChanged(): void {
    this.updateStreamAttributes();
  }

  @Watch('noDefaultLights')
  protected handleNoDefaultLightsChanged(): void {
    this.updateStreamAttributes();
  }

  /**
   * @ignore
   */
  @Watch('experimentalRenderingOptions')
  protected handleExperimentalRenderingOptionsChanged(): void {
    this.updateStreamAttributes();
  }

  /**
   * @ignore
   */
  @Watch('featureLines')
  protected handleFeatureLinesChanged(): void {
    this.updateStreamAttributes();
  }

  /**
   * @ignore
   */
  @Watch('selectionHighlighting')
  protected handleSelectionHighlightingChanged(): void {
    this.updateStreamAttributes();
  }

  /**
   * @ignore
   */
  @Watch('featureHighlighting')
  protected handleFeatureHighlightingChanged(): void {
    this.updateStreamAttributes();
  }

  /**
   * @ignore
   */
  @Watch('featureMaps')
  protected handleFeatureMapsChanged(): void {
    this.updateStreamAttributes();
  }

  /**
   * @ignore
   */
  @Watch('config')
  protected handleConfigChanged(): void {
    this.updateResolvedConfig();
  }

  /**
   * @ignore
   */
  @Watch('configEnv')
  protected handleConfigEnvChanged(): void {
    this.updateResolvedConfig();
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
    if (this.stream != null && this.dimensions != null) {
      this.calculateComponentDimensions();

      this.stream.update({
        streamAttributes: this.getStreamAttributes(),
        config: parseConfig(this.configEnv, this.config),
        dimensions: this.dimensions,
        frameBgColor: this.getBackgroundColor(),
      });
      await this.stream?.load(
        urn,
        this.clientId,
        this.getDeviceId(),
        this.getResolvedConfig()
      );
      this.sceneReady.emit();
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
    if (this.stream != null) {
      this.stream.disconnect();
      this.frame = undefined;
      this.errorMessage = undefined;
    }

    if (this.canvasElement != null) {
      const context = this.canvasElement.getContext('2d');
      if (context != null) {
        context.clearRect(
          0,
          0,
          this.canvasElement.width,
          this.canvasElement.height
        );
      }
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
    return this.stateMap.streamState.type === 'connected';
  }

  @Listen('tap')
  private async handleTapEvent(
    event: CustomEvent<TapEventDetails>
  ): Promise<void> {
    this.tapKeyInteractions
      .filter((i) => i.predicate(event.detail))
      .forEach((i) => i.fn(event.detail));
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
      entries.length > 0 &&
      this.dimensions != null &&
      !Dimensions.isEqual(entries[0].contentRect, this.viewport);

    if (dimensionsHaveChanged) {
      if (this.resizeTimer != null) {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = undefined;
      }

      if (!this.isResizing) {
        this.resizeTimer = setTimeout(() => {
          this.isResizing = true;
          this.isResizeUpdate = true;
          this.recalculateComponentDimensions();
        }, this.resizeDebounce);
      }
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
      this.viewport = Viewport.fromDimensions(
        this.getCanvasDimensions() ?? Dimensions.create(0, 0)
      );
    }
  }

  private recalculateComponentDimensions(): void {
    if (this.isResizing) {
      this.calculateComponentDimensions();
      this.isResizing = false;

      if (this.stream?.getState().type === 'connected') {
        this.updateDimensions(this.dimensions);
      }
    }
  }

  private reportPerformance(timings: Timing[]): void {
    if (this.stateMap.streamState.type === 'connected') {
      const payload = {
        timings: timings.map((t) => ({
          receiveToPaintDuration: toProtoDuration(t.duration),
        })),
      };
      this.getStream().recordPerformance(payload, false);
    }
  }

  private addStreamListeners(): void {
    this.stateMap.streamListeners = this.getStream().stateChanged.on((s) => {
      this.handleStreamStateChanged(this.stateMap.streamState, s);
    });
  }

  private handleStreamStateChanged(
    previous: ViewerStreamState,
    state: ViewerStreamState
  ): void {
    this.stateMap.streamState = state;

    if (state.type === 'connecting') {
      this.handleConnecting(previous, state);
    } else if (state.type === 'connected') {
      this.handleConnected(previous, state);
    } else if (state.type === 'connection-failed') {
      this.handleConnectionFailed(previous, state);
    } else if (state.type === 'disconnected') {
      this.handleDisconnected(previous, state);
    } else if (state.type === 'reconnecting') {
      this.frame = undefined;
    }
  }

  private handleConnecting(
    previous: ViewerStreamState,
    state: Connecting
  ): void {
    if (previous.type !== 'connecting') {
      this.token = undefined;
      this.errorMessage = undefined;
      this.emitConnectionChange({ status: 'connecting' });
    }
  }

  private handleConnected(previous: ViewerStreamState, state: Connected): void {
    this.token = state.token.token;

    if (previous.type !== 'connected') {
      this.errorMessage = undefined;
      this.canvasRenderer = measureCanvasRenderer(
        paintTime,
        createCanvasRenderer(),
        this.getResolvedConfig().flags.logFrameRate,
        (timings) => this.reportPerformance(timings)
      );
      this.emitConnectionChange({
        status: 'connected',
        jwt: state.token.token,
      });
      this.deviceIdChange.emit(state.deviceId);
    }

    if (this.frame?.sequenceNumber !== state.frame.sequenceNumber) {
      this.updateFrame(state.frame);
    }

    this.updateDimensions(this.dimensions);
  }

  private handleConnectionFailed(
    previous: ViewerStreamState,
    state: ConnectionFailed
  ): void {
    if (previous.type !== 'connection-failed') {
      this.token = undefined;
      this.errorMessage = state.message;
    }
  }

  private handleDisconnected(
    previous: ViewerStreamState,
    state: Disconnected
  ): void {
    if (previous.type !== 'disconnected') {
      this.token = undefined;
      this.errorMessage = undefined;
      this.emitConnectionChange({ status: 'disconnected' });
    }
  }

  private updateDimensions(dimensions?: Dimensions.Dimensions): void {
    this.stream?.update({ dimensions });
    this.dimensionschange.emit(dimensions);
  }

  private async updateFrame(frame: Frame): Promise<void> {
    const canvasDimensions = this.getCanvasDimensions();

    if (
      this.canvasElement != null &&
      canvasDimensions != null &&
      this.frame?.sequenceNumber !== frame.sequenceNumber
    ) {
      const canvas = this.canvasElement.getContext('2d');
      if (canvas != null) {
        const previousFrame = this.frame;
        this.frame = frame;

        this.updateInteractionApi(previousFrame);

        const data = {
          canvas,
          canvasDimensions,
          dimensions: this.dimensions,
          frame: this.frame,
          viewport: this.viewport,
          beforeDraw: () => {
            this.updateCanvasDimensions(canvasDimensions);
            this.isResizeUpdate = false;
          },
          predicate: () => {
            if (this.isResizeUpdate) {
              return (
                this.dimensions == null ||
                Dimensions.isEqual(
                  this.dimensions,
                  data.frame.image.imageAttr.frameDimensions
                )
              );
            }
            return true;
          },
        };

        this.frameReceived.emit(this.frame);

        if (this.frame.scene.hasChanged) {
          this.sceneChanged.emit();
        }

        const drawnFrame = await this.canvasRenderer(data);

        if (drawnFrame != null) {
          this.dispatchFrameDrawn(drawnFrame);
        }
      }
    }
  }

  private async initializeDefaultInteractionHandlers(): Promise<void> {
    await this.initializeDefaultCameraInteractionHandlers();
    await this.initializeDefaultTapInteractionHandler();
    this.initializeDefaultKeyboardInteractionHandlers();

    if (this.rotateAroundTapPoint) {
      this.baseInteractionHandler?.setPrimaryInteractionType('rotate-point');
    }
  }

  private clearDefaultCameraInteractionHandlers(): void {
    this.defaultInteractionHandlerDisposables.forEach((disposable) =>
      disposable.dispose()
    );
    this.defaultInteractionHandlerDisposables = [];
  }

  private clearDefaultKeyboardInteractions(): void {
    this.defaultTapKeyInteractions.forEach((interaction) => {
      const index = this.tapKeyInteractions.indexOf(interaction);
      if (index !== -1) {
        this.tapKeyInteractions.splice(index, 1);
      }
    });
    this.tapKeyInteractions = [];
  }

  private async initializeDefaultCameraInteractionHandlers(): Promise<void> {
    this.clearDefaultCameraInteractionHandlers();

    if (this.cameraControls) {
      if (window.PointerEvent != null) {
        this.baseInteractionHandler =
          this.baseInteractionHandler ??
          new PointerInteractionHandler(() => this.getResolvedConfig());
        const baseDisposable = await this.registerInteractionHandler(
          this.baseInteractionHandler
        );
        const multiPointerDisposable = await this.registerInteractionHandler(
          new MultiPointerInteractionHandler()
        );

        this.defaultInteractionHandlerDisposables = [
          baseDisposable,
          multiPointerDisposable,
        ];
      } else {
        // fallback to touch events and mouse events as a default
        this.baseInteractionHandler =
          this.baseInteractionHandler ??
          new MouseInteractionHandler(() => this.getResolvedConfig());
        const baseDisposable = await this.registerInteractionHandler(
          this.baseInteractionHandler
        );
        const touchDisposable = await this.registerInteractionHandler(
          new TouchInteractionHandler()
        );

        this.defaultInteractionHandlerDisposables = [
          baseDisposable,
          touchDisposable,
        ];
      }
    }
  }

  private initializeDefaultKeyboardInteractionHandlers(): void {
    this.clearDefaultKeyboardInteractions();

    if (this.keyboardControls && this.stream != null) {
      this.baseInteractionHandler?.setDefaultKeyboardControls(
        this.keyboardControls
      );

      const flyToPart = new FlyToPartKeyInteraction(
        this.stream,
        () => this.getResolvedConfig(),
        () => this.getImageScale()
      );
      const flyToPosition = new FlyToPositionKeyInteraction(
        this.stream,
        () => this.getResolvedConfig(),
        () => this.getImageScale(),
        () => this.createScene()
      );

      this.registerTapKeyInteraction(flyToPart);
      this.registerTapKeyInteraction(flyToPosition);

      this.defaultTapKeyInteractions = [flyToPart, flyToPosition];
    }
  }

  private async initializeDefaultTapInteractionHandler(): Promise<void> {
    if (this.tapHandlerDisposable == null) {
      if (window.PointerEvent != null) {
        const tapInteractionHandler = new TapInteractionHandler(
          'pointerdown',
          'pointerup',
          'pointermove',
          () => this.getResolvedConfig()
        );

        this.tapHandlerDisposable = await this.registerInteractionHandler(
          tapInteractionHandler
        );
      } else {
        const tapInteractionHandler = new TapInteractionHandler(
          'mousedown',
          'mouseup',
          'mousemove',
          () => this.getResolvedConfig()
        );

        this.tapHandlerDisposable = await this.registerInteractionHandler(
          tapInteractionHandler
        );
      }
    }
  }

  private initializeInteractionHandler(handler: InteractionHandler): void {
    if (this.stateMap.interactionTarget == null) {
      throw new InteractionHandlerError(
        'Cannot initialize interaction handler. Interaction target is undefined.'
      );
    }
    if (this.interactionApi == null) {
      throw new InteractionHandlerError(
        'Cannot initialize interaction handler. Interaction APi is undefined.'
      );
    }
    handler.initialize(this.stateMap.interactionTarget, this.interactionApi);
  }

  private createInteractionApi(): InteractionApi {
    if (this.stream == null) {
      throw new ComponentInitializationError(
        'Cannot create interaction API. Component has not been initialized.'
      );
    }

    return this.frame == null || this.frame.scene.camera.isPerspective()
      ? new InteractionApiPerspective(
          this.stream,
          this.stateMap.cursorManager,
          () => this.getResolvedConfig().interactions,
          () => this.createScene(),
          () => this.frame,
          () => this.viewport,
          this.tap,
          this.doubletap,
          this.longpress,
          this.interactionStarted,
          this.interactionFinished
        )
      : new InteractionApiOrthographic(
          this.stream,
          this.stateMap.cursorManager,
          () => this.getResolvedConfig().interactions,
          () => this.createScene(),
          () => this.frame,
          () => this.viewport,
          this.tap,
          this.doubletap,
          this.longpress,
          this.interactionStarted,
          this.interactionFinished
        );
  }

  private handleCursorChanged(): void {
    window.requestAnimationFrame(() => {
      this.cursor = this.stateMap.cursorManager.getActiveCursor();
    });
  }

  private createScene(): Scene {
    if (this.stateMap.streamState.type !== 'connected') {
      throw new IllegalStateError(
        'Cannot create scene. Viewer stream is not connected.'
      );
    }

    const { frame, sceneId, sceneViewId, worldOrientation } =
      this.stateMap.streamState;

    return new Scene(
      this.getStream(),
      frame,
      fromPbFrameOrThrow(worldOrientation),
      () => this.getImageScale(),
      this.viewport,
      sceneId,
      sceneViewId
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

  private getBounds(): ClientRect | undefined {
    return getElementBoundingClientRect(this.hostElement);
  }

  private getCanvasDimensions(): Dimensions.Dimensions | undefined {
    return this.getResolvedConfig().flags.letterboxFrames
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

  private getStreamAttributes(): StreamAttributes {
    return {
      depthBuffers: this.getDepthBufferStreamAttributesValue(),
      experimentalGhosting: this.experimentalGhostingOpacity,
      noDefaultLights: this.noDefaultLights,
      featureLines: this.featureLines,
      featureHighlighting: this.featureHighlighting,
      featureMaps: this.featureMaps,
      experimentalRenderingOptions: this.experimentalRenderingOptions,
      selectionHighlighting: this.selectionHighlighting,
    };
  }

  private updateCanvasDimensions(dimensions: Dimensions.Dimensions): void {
    if (this.canvasElement != null) {
      this.canvasElement.width = dimensions.width;
      this.canvasElement.height = dimensions.height;
    }
  }

  private updateStreamAttributes(): void {
    this.stream?.update({ streamAttributes: this.getStreamAttributes() });
  }

  private updateInteractionApi(previousFrame?: Frame): void {
    if (this.frame != null) {
      const hasChangedFromPerspective =
        (previousFrame == null || previousFrame.scene.camera.isPerspective()) &&
        this.frame.scene.camera.isOrthographic();
      const hasChangedFromOrthographic =
        (previousFrame == null ||
          previousFrame.scene.camera.isOrthographic()) &&
        this.frame.scene.camera.isPerspective();

      if (hasChangedFromPerspective || hasChangedFromOrthographic) {
        this.interactionApi = this.createInteractionApi();
        this.cameraType = this.frame.scene.camera.isPerspective()
          ? 'perspective'
          : 'orthographic';
        this.cameraTypeChanged.emit(this.cameraType);

        this.interactionHandlers.forEach((handler) =>
          this.initializeInteractionHandler(handler)
        );
      }
    }
  }

  private updateCameraType(): void {
    if (this.frame != null) {
      if (
        this.cameraType === 'orthographic' &&
        this.frame.scene.camera.isPerspective()
      ) {
        this.stream?.replaceCamera({
          camera: FrameCamera.toProtobuf(
            FrameCamera.toOrthographic(
              this.frame.scene.camera,
              this.frame.scene.boundingBox
            )
          ),
        });
      } else if (
        this.cameraType === 'perspective' &&
        this.frame.scene.camera.isOrthographic()
      ) {
        this.stream?.replaceCamera({
          camera: FrameCamera.toProtobuf(
            FrameCamera.toPerspective(this.frame.scene.camera)
          ),
        });
      }
    }
  }

  private getDepthBufferStreamAttributesValue(): FrameType {
    const depthBuffer =
      this.depthBuffers ?? (this.rotateAroundTapPoint ? 'final' : undefined);
    return depthBuffer;
  }

  private updateResolvedConfig(): void {
    this.resolvedConfig = parseConfig(this.configEnv, this.config);
  }

  private getResolvedConfig(): Config {
    return getRequiredProp(
      'Resolved config is undefined',
      () => this.resolvedConfig
    );
  }

  private getStream(): ViewerStream {
    return getRequiredProp('Stream is undefined', () => this.stream);
  }

  private getDeviceId(): string | undefined {
    if (this.deviceId == null) {
      try {
        this.deviceId = getStorageEntry(
          StorageKeys.DEVICE_ID,
          (entry) => entry['device-id']
        );
      } catch (e) {
        console.warn('Cannot read device ID. Local storage is not supported.');
      }

      if (this.deviceId == null) {
        this.deviceId = UUID.create();

        try {
          upsertStorageEntry(StorageKeys.DEVICE_ID, {
            ['device-id']: this.deviceId,
          });
        } catch (e) {
          console.warn(
            'Cannot write device ID. Local storage is not supported.'
          );
        }
      }
    }
    return this.deviceId;
  }
}

function getRequiredProp<T>(errorMsg: string, getter: () => T | undefined): T {
  const value = getter();
  if (value != null) {
    return value;
  } else throw new Error(errorMsg);
}
