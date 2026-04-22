// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Element, Event, EventEmitter, h, Host, Method, Prop, Watch } from '@stencil/core';
import { Dimensions, Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import { InteractionHandler } from '@vertexvis/viewer/src';
import { InteractionApi } from '@vertexvis/viewer/src/lib/interactions';
import classNames from 'classnames';

import { PartialConfig } from '../../lib/config';
import { DocumentApi, DocumentApiState } from '../../lib/document/api';
import { DocumentLayersController } from '../../lib/document/layers/controller';
import { DocumentProvider } from '../../lib/document/provider';
import { DocumentRenderer } from '../../lib/document/renderer';
import { getElementBoundingClientRect } from '../../lib/dom';
import { PanInteractionHandler } from '../../lib/interactions/pan-interaction-handler';
import { PdfJsProvider } from '../../lib/pdf/pdfjs-provider';

export type InteractionMode = 'none' | 'pan';

@Component({
  tag: 'vertex-document-viewer',
  styleUrl: 'document-viewer.css',
  shadow: true,
})
export class VertexDocumentViewer {
  /**
   * A URI of the document to load when the component is mounted in the DOM tree.
   * Currently only supports URLs for client-side rendering.
   */
  @Prop() public src?: string;

  /**
   * The ID of the loaded `Document`. This ID is required to enable persistence of
   * annotations.
   *
   * Note that this is different than a `File` ID within the Vertex Platform, and must
   * be created separately using the `/documents` endpoints.
   * See https://docs.vertex3d.com/ for more details.
   */
  @Prop({ reflect: true }) public documentId?: string;

  /**
   * The provider used to create the document API and renderer.
   */
  @Prop({ mutable: true }) public provider: DocumentProvider = new PdfJsProvider();

  /**
   * The interaction mode for the viewer. When set to `'pan'`, click and drag
   * will pan the document. When set to `'none'`, no pointer interactions
   * are registered.
   */
  @Prop() public interactionMode: InteractionMode = 'pan';

  /**
   * Common state of the current document. This value includes information common to all
   * types of documents, including state like zoom percentage, viewport definition, and offsets.
   */
  @Prop({ mutable: true }) public documentState?: DocumentApiState;

  /**
   * Controller for interacting with layers in the currently loaded document.
   *
   * This controller will automatically be created along with the loaded document.
   * Note that the methods available on this controller will only be supported if
   * the underlying document type supports layers.
   */
  @Prop({ mutable: true }) public layers?: DocumentLayersController;

  /**
   * Configuration values for the document viewer. See {@link Config} for more information
   * on the available configuration options.
   */
  @Prop() public config?: PartialConfig;

  /**
   * An optional value that will debounce image updates when resizing
   * this viewer element.
   */
  @Prop() public resizeDebounce = 100;

  /**
   * Emits an event when the document is ready to be interacted with.
   */
  @Event() public documentReady!: EventEmitter<void>;

  @Element() private hostEl!: HTMLElement;

  private viewerContainerElement?: HTMLDivElement;
  private canvasContainerElement?: HTMLDivElement;
  private canvasEl?: HTMLCanvasElement;

  private dimensions: Dimensions.Dimensions = Dimensions.create(0, 0);
  private resizeObserver?: ResizeObserver;
  private resizeTimer?: number;

  private documentRenderer?: DocumentRenderer;
  private documentApi?: DocumentApi;
  private documentApiStateChangedDisposable?: Disposable;

  private interactionHandlers: InteractionHandler[] = [];
  private interactionApi!: InteractionApi;

  private panInteractionHandler?: PanInteractionHandler;

  protected componentWillLoad(): void {
    this.handleElementResize = this.handleElementResize.bind(this);
    this.handleDocumentApiStateChanged = this.handleDocumentApiStateChanged.bind(this);

    this.resizeObserver = new ResizeObserver(this.handleElementResize);
  }

  protected componentShouldUpdate(newValue: unknown, oldValue: unknown, propName: string): boolean {
    // Ignore updates to the documentState property, as it is only intended to reflect the current state
    // of the document and should not trigger a rerender.
    return propName !== 'documentState';
  }

  protected componentDidLoad(): void {
    this.resizeObserver?.observe(this.hostEl);

    this.updateComponentDimensions();
    this.handleSrcChange();
  }

  protected disconnectedCallback(): void {
    this.resizeObserver?.disconnect();

    this.clearCurrentDocument();
  }

  /**
   * Registers and initializes an interaction handler with the document viewer. Returns a
   * `Disposable` that should be used to deregister the interaction handler.
   *
   * `InteractionHandler`s are used to build custom mouse and touch interactions.
   *
   * @param interactionHandler The interaction handler to register.
   * @returns {Promise<void>} A promise containing the disposable to use to
   *  deregister the handler.
   */
  @Method()
  public async registerInteractionHandler(interactionHandler: InteractionHandler): Promise<Disposable> {
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
   * Pans the currently loaded document by the specified delta.
   *
   * This method will be bounded to the visible portion of the document to ensure
   * at least a portion of the document is always visible, and the `canvas` does not
   * appear blank.
   *
   * @param delta The delta to pan the document by.
   */
  @Method()
  public async panByDelta(delta: Point.Point): Promise<void> {
    await this.getDocumentApi().panByDelta(delta);
  }

  /**
   * Zooms the currently loaded document to the specified zoom percentage.
   *
   * This method will automatically adjust existing offsets to maintain the
   * same center point of the document where possible.
   *
   * @param percentage The zoom percentage to set.
   */
  @Method()
  public async zoomTo(percentage: number): Promise<void> {
    await this.getDocumentApi().zoomTo(percentage);
  }

  /**
   * Loads a specific page of the currently loaded document.
   *
   * Note that any offset applied by panning the document will be reset when loading
   * a new page.
   *
   * @param pageNumber The page number to load.
   */
  @Method()
  public async loadPage(pageNumber: number): Promise<void> {
    const documentApi = this.getDocumentApi();

    await documentApi.loadPage(pageNumber);
  }

  @Watch('src')
  protected async handleSrcChange(): Promise<void> {
    if (this.src != null && this.canvasEl != null) {
      this.clearCurrentDocument();

      const { api, renderer } = this.provider.create(this.canvasEl, this.config);
      this.documentApi = api;
      this.documentRenderer = renderer;
      this.layers = new DocumentLayersController(api);
      this.updateInteractionHandler();
      this.updateDocumentApiListeners();

      await this.documentApi.updateViewport(this.dimensions);
      await this.documentApi.load(this.src);
      await this.documentApi.loadPage(1);

      this.documentReady.emit();
    }
  }

  @Watch('config')
  protected handleConfigChange(): void {
    this.clearCurrentDocument();
    this.handleSrcChange();
  }

  @Watch('interactionMode')
  protected handleInteractionModeChange(): void {
    this.updateInteractionHandler();
  }

  public render(): void {
    return (
        <Host>
          <div ref={ref => (this.viewerContainerElement = ref)} class="viewer-container" onContextMenu={event => event.preventDefault()}>
            <div
                ref={ref => (this.canvasContainerElement = ref)}
                class={classNames('canvas-container', {
                  'enable-pointer-events ': window.PointerEvent != null,
                })}
            >
              <canvas role="presentation" ref={el => (this.canvasEl = el)} />
            </div>

            <slot></slot>
          </div>
        </Host>
    );
  }

  private getDocumentApi(): DocumentApi {
    if (this.documentApi == null) {
      throw new Error('No document has been loaded. Ensure that the `src` property is set and the resource is accessible.');
    }

    return this.documentApi;
  }

  private clearCurrentDocument(): void {
    this.documentRenderer?.dispose();
    this.documentApi?.dispose();
    this.panInteractionHandler?.dispose();
    this.documentApiStateChangedDisposable?.dispose();
    this.layers = undefined;
  }

  private handleDocumentApiStateChanged(state: DocumentApiState): void {
    this.documentState = state;
  }

  private updateDocumentApiListeners(): void {
    this.documentApiStateChangedDisposable = this.documentApi?.onStateChanged(this.handleDocumentApiStateChanged);
  }

  private updateInteractionHandler(): void {
    this.panInteractionHandler?.dispose();

    if (this.interactionMode === 'pan' && this.canvasEl != null && this.documentApi != null) {
      this.panInteractionHandler = new PanInteractionHandler(this.canvasEl, this.documentApi);
    }
  }

  private updateComponentDimensions(dimensions?: Dimensions.Dimensions): void {
    this.dimensions = dimensions ?? getElementBoundingClientRect(this.hostEl);

    if (this.canvasEl != null) {
      this.canvasEl.width = Math.floor(this.dimensions.width * window.devicePixelRatio);
      this.canvasEl.height = Math.floor(this.dimensions.height * window.devicePixelRatio);
      this.canvasEl.style.width = `${this.dimensions.width}px`;
      this.canvasEl.style.height = `${this.dimensions.height}px`;
    }
  }

  private async handleElementResize(entries: ResizeObserverEntry[]): Promise<void> {
    const dimensionsHaveChanged = entries.length > 0 && this.dimensions != null && !Dimensions.isEqual(entries[0].contentRect, this.dimensions);

    if (dimensionsHaveChanged) {
      this.restartResizeTimer(Dimensions.create(entries[0].contentRect.width, entries[0].contentRect.height));
    }
  }

  private restartResizeTimer(dimensions: Dimensions.Dimensions): void {
    if (this.resizeTimer != null) {
      window.clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = window.setTimeout(async () => {
      this.updateComponentDimensions(dimensions);
      await this.documentApi?.updateViewport(this.dimensions);
    }, this.resizeDebounce);
  }

  private initializeInteractionHandler(handler: InteractionHandler): void {
    if (this.canvasEl == null || this.interactionApi == null) {
      throw new Error('Cannot initialize interaction handler');
    }

    handler.initialize(this.canvasEl, this.interactionApi);
  }
}
