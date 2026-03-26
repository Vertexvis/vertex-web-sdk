import { Dimensions, Point } from '@vertexvis/geometry';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

import { DocumentApi, DocumentApiState } from '../document/api';
import { fromUri } from '../types/loadableResource';

export interface PdfJsApiState extends DocumentApiState {
  readonly document?: pdfjs.PDFDocumentProxy;
}

export class PdfJsApi extends DocumentApi<PdfJsApiState> {
  public constructor() {
    super({
      panOffset: Point.create(0, 0),
      zoomPercentage: 100,
    });

    pdfjs.GlobalWorkerOptions.workerSrc = '/dist/assets/pdf.worker.min.mjs';
  }

  public dispose(): void {
    this.state.document?.destroy();
  }

  public async load(uri: string): Promise<void> {
    const resource = fromUri(uri);

    if (resource.resource.type === 'url') {
      const document = await pdfjs.getDocument(resource.resource.url).promise;

      this.updateState({ document });
    } else {
      throw new Error('Invalid resource URI provided. Expected a URL to retrieve a PDF.');
    }
  }

  public async loadPage(pageNumber: number): Promise<void> {
    const page = await this.state.document?.getPage(pageNumber);
    const baseViewport = page?.getViewport({ scale: 1 });
    const contentDimensions = baseViewport != null ? Dimensions.create(baseViewport.width, baseViewport.height) : undefined;

    this.updateState({ loadedPageNumber: pageNumber, contentDimensions });
  }
}
