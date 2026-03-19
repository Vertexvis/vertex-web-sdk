import { Dimensions } from '@vertexvis/geometry';
import * as pdfjs from 'pdfjs-dist';

import { DocumentApi } from '../document/api';
import { fromUri } from '../types/loadableResource';

export interface PdfJsApiState {
  readonly document?: pdfjs.PDFDocumentProxy;
  readonly loadedPageNumber?: number;
  readonly viewport?: Dimensions.Dimensions;
}

export class PdfJsApi extends DocumentApi<PdfJsApiState> {
  public constructor() {
    super();

    pdfjs.GlobalWorkerOptions.workerSrc = '/dist/assets/pdf.worker.min.mjs';
  }

  public async updateViewport(dimensions: Dimensions.Dimensions): Promise<void> {
    if (this.state?.viewport == null || !Dimensions.isEqual(this.state?.viewport, dimensions)) {
      this.updateState({
        ...this.state,
        viewport: dimensions,
      });
    }
  }

  public async load(uri: string): Promise<void> {
    const resource = fromUri(uri);

    if (resource.resource.type === 'url') {
      const document = await pdfjs.getDocument(resource.resource.url).promise;

      this.updateState({
        ...this.state,
        document,
      });
    } else {
      throw new Error('Invalid resource URI provided. Expected a URL to retrieve a PDF.');
    }
  }

  public async loadPage(pageNumber: number): Promise<void> {
    this.updateState({
      ...this.state,
      loadedPageNumber: pageNumber,
    });
  }
}
