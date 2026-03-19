// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Element, h, Host, Prop, Watch } from '@stencil/core';
import { Dimensions } from '@vertexvis/geometry';
import classNames from 'classnames';

import { DocumentApi } from '../../lib/document/api';
import { DocumentRenderer } from '../../lib/document/renderer';
import { getElementBoundingClientRect } from '../../lib/dom';
import { PdfJsApi } from '../../lib/pdf/pdfjs-api';
import { PdfJsRenderer } from '../../lib/pdf/pdfjs-renderer';

@Component({
  tag: 'vertex-document-viewer',
  styleUrl: 'document-viewer.css',
  shadow: true,
})
export class VertexDocumentViewer {
  /**
   * A URI of the document to load when the component is mounted in the DOM tree.
   * Currently only URLs are supported.
   */
  @Prop() public src?: string;

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

  protected componentWillLoad(): void {
    this.handleElementResize = this.handleElementResize.bind(this);

    this.resizeObserver = new ResizeObserver(this.handleElementResize);
  }

  protected componentDidLoad(): void {
    this.resizeObserver?.observe(this.hostEl);

    this.updateComponentDimensions();
    this.handleUrlChange();
  }

  protected disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
  }

  @Watch('src')
  protected async handleUrlChange(): Promise<void> {
    if (this.src != null && this.canvasEl != null) {
      this.documentRenderer?.dispose();

      this.documentApi = new PdfJsApi();
      this.documentRenderer = new PdfJsRenderer(this.documentApi, this.canvasEl);

      await this.documentApi.updateViewport(this.dimensions);
      await this.documentApi.load(this.src);
      await this.documentApi.loadPage(1);
    }
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
