import { Dimensions } from '@vertexvis/geometry';
import { Disposable } from '@vertexvis/utils';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

import { DocumentRenderer } from '../document/renderer';
import { PdfJsApi, PdfJsApiState } from './pdfjs-api';

interface PdfJsRendererState {
  pages: Record<number, pdfjs.PDFPageProxy>;
  pendingStateChange?: PdfJsApiState;
  rendering: boolean;
}

export class PdfJsRenderer extends DocumentRenderer {
  private stateChangedDisposable: Disposable;
  private state: PdfJsRendererState = { pages: {}, rendering: false };

  public constructor(api: PdfJsApi, canvas: HTMLCanvasElement) {
    super(api, canvas);

    this.handleStateChanged = this.handleStateChanged.bind(this);

    this.stateChangedDisposable = this.api.onStateChanged(this.handleStateChanged);
  }

  public dispose(): void {
    this.stateChangedDisposable.dispose();
  }

  private async handleStateChanged(state: PdfJsApiState): Promise<void> {
    await this.renderPage(state);
  }

  private async renderPage(state: PdfJsApiState): Promise<void> {
    const { document, loadedPageNumber, viewport, panOffset, zoomPercentage } = state;

    if (this.state.rendering) {
      this.state.pendingStateChange = state;
      return;
    }

    if (document != null && loadedPageNumber != null) {
      this.state.rendering = true;

      if (this.state.pages[loadedPageNumber] == null) {
        this.state.pages[loadedPageNumber] = await document.getPage(loadedPageNumber);
      }

      const page = this.state.pages[loadedPageNumber];
      const dimensions = viewport ?? Dimensions.create(0, 0);
      const baseViewport = page.getViewport({ scale: 1 });
      const scaleX = dimensions.width / baseViewport.width;
      const scaleY = dimensions.height / baseViewport.height;
      const baseScale = Math.max(0.1, Math.min(scaleX, scaleY));

      const scaled = page.getViewport({
        scale: baseScale * (zoomPercentage / 100),
        offsetX: panOffset.x,
        offsetY: panOffset.y,
      });

      await page.render({
        canvas: this.canvas,
        viewport: scaled,
        intent: 'display',
        background: '#ffffff',
        optionalContentConfigPromise: document.getOptionalContentConfig(),
      }).promise;

      this.state.rendering = false;
    }
  }
}
