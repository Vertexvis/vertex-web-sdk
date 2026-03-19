import { Dimensions } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import * as pdfjs from 'pdfjs-dist';

import { DocumentRenderer } from '../document/renderer';
import { PdfJsApi, PdfJsApiState } from './pdfjs-api';

interface PdfJsRendererState {
  readonly pages: Record<number, pdfjs.PDFPageProxy>;
}

export class PdfJsRenderer extends DocumentRenderer {
  private stateChangedDisposable: Disposable;
  private state: PdfJsRendererState = { pages: {} };

  public constructor(private api: PdfJsApi, private canvas: HTMLCanvasElement) {
    super();

    this.handleStateChanged = this.handleStateChanged.bind(this);

    this.stateChangedDisposable = this.api.onStateChanged(this.handleStateChanged);
  }

  public dispose(): void {
    this.stateChangedDisposable.dispose();
  }

  private async handleStateChanged(state: PdfJsApiState): Promise<void> {
    await this.loadPage(state);
  }

  private async loadPage(state: PdfJsApiState): Promise<void> {
    const { document, loadedPageNumber, viewport } = state;

    if (document != null && loadedPageNumber != null) {
      const existingPage = this.state.pages[loadedPageNumber];

      if (existingPage == null) {
        this.state.pages[loadedPageNumber] = await document.getPage(loadedPageNumber);
      }

      const pageToLoad = this.state.pages[loadedPageNumber];
      const dimensions = viewport ?? Dimensions.create(0, 0);
      const pageBaseViewport = pageToLoad.getViewport({ scale: 1 });
      const scaleX = Math.max(0.1, dimensions.width / pageBaseViewport.width);
      const scaleY = Math.max(0.1, dimensions.height / pageBaseViewport.height);

      const scaled = pageToLoad.getViewport({
        scale: Math.min(scaleX, scaleY),
      });

      this.state.pages[loadedPageNumber].render({
        canvas: this.canvas,
        viewport: scaled,
        intent: 'display',
        background: '#ffffff',
        optionalContentConfigPromise: document.getOptionalContentConfig(),
      });
    }
  }
}
