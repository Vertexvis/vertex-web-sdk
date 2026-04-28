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
  private offscreenCanvas: HTMLCanvasElement;

  public constructor(api: PdfJsApi, canvas: HTMLCanvasElement) {
    super(api, canvas);

    // Render pages using an offscreen canvas to avoid flickering that can occur for
    // PDFs with annotations.
    this.offscreenCanvas = document.createElement('canvas');

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
    const { document, loadedPageNumber, viewport, panOffset, zoomPercentage, optionalContentConfig } = state;

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
      const scaledDimensions = Dimensions.scale(window.devicePixelRatio, window.devicePixelRatio, dimensions);
      const baseViewport = page.getViewport({ scale: 1 });
      const scaleX = scaledDimensions.width / baseViewport.width;
      const scaleY = scaledDimensions.height / baseViewport.height;
      const baseScale = Math.max(0.1, Math.min(scaleX, scaleY));

      // If the zoom percentage or viewport dimensions result in a situation where the content
      // has been scaled down to a point where the horizontal dimension is smaller than the viewport,
      // adjust the current panOffset by the difference between the viewport width and the scaled width.
      // This ensures that the content is always centered in the viewport horizontally.
      const effectiveScale = baseScale * (zoomPercentage / 100);
      const scaledWidth = baseViewport.width * effectiveScale;
      const centerOffsetX = Math.max(0, (scaledDimensions.width - scaledWidth) / 2);

      const scaled = page.getViewport({
        scale: effectiveScale,
        offsetX: panOffset.x + centerOffsetX,
        offsetY: panOffset.y,
      });

      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;

      await page.render({
        canvas: this.offscreenCanvas,
        viewport: scaled,
        intent: 'display',
        optionalContentConfigPromise: optionalContentConfig != null ? Promise.resolve(optionalContentConfig) : undefined,
      }).promise;

      // Emit an event before the page is drawn, then draw the page to the canvas on the next
      // animation frame. This allows for more accurate synchronization of external content with the canvas.
      this.pageLoaded.emit(state);

      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => {
          const ctx = this.canvas.getContext('2d');
          if (ctx != null) {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
          }

          resolve();
        });
      });

      this.pageDrawn.emit(state);

      this.state.rendering = false;
    }
  }
}
