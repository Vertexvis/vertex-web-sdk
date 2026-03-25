// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Element, h, Host, Method, Prop, Watch } from '@stencil/core';
import { Dimensions, Point } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { DocumentApi, DocumentApiState } from '../../lib/document/api';
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
   * An optional value that will debounce image updates when resizing
   * this viewer element.
   */
  @Prop() public resizeDebounce = 100;

  @Element() private hostEl!: HTMLElement;

  private viewerContainerElement?: HTMLDivElement;
  private canvasContainerElement?: HTMLDivElement;
  private canvasEl?: HTMLCanvasElement;

  private dimensions: Dimensions.Dimensions = Dimensions.create(0, 0);
  private resizeObserver?: ResizeObserver;
  private resizeTimer?: number;

  private documentRenderer?: DocumentRenderer;
  private documentApi?: DocumentApi;
  private panInteractionHandler?: PanInteractionHandler;
  private documentApiStateChangedDisposable?: Disposable;

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

  @Method()
  public async panByDelta(delta: Point.Point): Promise<void> {
    await this.documentApi?.panByDelta(delta);
  }

  @Method()
  public async zoomTo(percentage: number): Promise<void> {
    await this.documentApi?.zoomTo(percentage);
  }

  @Watch('src')
  protected async handleSrcChange(): Promise<void> {
    if (this.src != null && this.canvasEl != null) {
      this.clearCurrentDocument();

      const { api, renderer } = this.provider.create(this.canvasEl);
      this.documentApi = api;
      this.documentRenderer = renderer;
      this.updateInteractionHandler();
      this.updateDocumentApiListeners();

      await this.documentApi.updateViewport(this.dimensions);
      await this.documentApi.load(this.src);
      await this.documentApi.loadPage(1);
    }
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
            <canvas ref={el => (this.canvasEl = el)} />
          </div>
        </div>
      </Host>
    );
  }

  private clearCurrentDocument(): void {
    this.documentRenderer?.dispose();
    this.documentApi?.dispose();
    this.panInteractionHandler?.dispose();
    this.documentApiStateChangedDisposable?.dispose();
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
      this.canvasEl.width = this.dimensions.width;
      this.canvasEl.height = this.dimensions.height;
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
}
