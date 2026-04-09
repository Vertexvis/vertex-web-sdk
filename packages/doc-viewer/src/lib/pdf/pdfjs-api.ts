import { Dimensions, Point } from '@vertexvis/geometry';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config.d.js';

import { Config } from '../config';
import { DocumentApi, DocumentApiState } from '../document/api';
import { DocumentLayer, LayerSupport } from '../document/layers';
import { fromUri } from '../types/loadableResource';
import { getWorkerSrc } from './util/worker-src';

export interface PdfJsApiState extends DocumentApiState {
  readonly document?: pdfjs.PDFDocumentProxy;
  readonly optionalContentConfig?: OptionalContentConfig;

  readonly layers?: DocumentLayer[];
}

export class PdfJsApi extends DocumentApi<PdfJsApiState> implements LayerSupport {
  private workerSrcInitialized = false;

  public constructor(private readonly config?: Config) {
    super({
      panOffset: Point.create(0, 0),
      zoomPercentage: 100,
    });
  }

  public dispose(): void {
    this.state.document?.destroy();
  }

  public async load(uri: string): Promise<void> {
    await this.initializeWorkerSrc();

    const resource = fromUri(uri);

    if (resource.resource.type === 'url') {
      const document = await pdfjs.getDocument(resource.resource.url).promise;
      const optionalContentConfig = await document.getOptionalContentConfig();

      this.updateState({
        document,
        totalPageCount: document.numPages,
        optionalContentConfig,
        layers: Array.from(optionalContentConfig).map(([id, group]) => ({ id, name: group.name ?? id, visible: group.visible })),
      });
    } else {
      throw new Error('Invalid resource URI provided. Expected a URL to retrieve a PDF.');
    }
  }

  public async loadPage(pageNumber: number): Promise<void> {
    await this.initializeWorkerSrc();

    const totalPageCount = this.state.totalPageCount ?? 1;

    if (pageNumber <= 0) {
      throw new Error(`Unable to load page ${pageNumber}. The provided page number must be greater than 0.`);
    } else if (pageNumber > totalPageCount) {
      throw new Error(`Unable to load page ${pageNumber}. The document only has ${totalPageCount} page(s).`);
    }

    const page = await this.state.document?.getPage(pageNumber);
    const baseViewport = page?.getViewport({ scale: 1 });
    const contentDimensions = baseViewport != null ? Dimensions.create(baseViewport.width, baseViewport.height) : undefined;

    this.updateState({ loadedPageNumber: pageNumber, contentDimensions, panOffset: Point.create(0, 0) });
  }

  public getLayers(): DocumentLayer[] {
    return this.state.layers ?? [];
  }

  public setLayerVisibility(id: string, visible: boolean): void {
    const { optionalContentConfig } = this.state;

    if (optionalContentConfig == null) {
      throw new Error('No document has been loaded. Unable to set layer visibility.');
    }

    optionalContentConfig.setVisibility(id, visible);

    this.updateState({
      optionalContentConfig,
      layers: Array.from(optionalContentConfig).map(([id, group]) => ({ id, name: group.name ?? id, visible: group.visible })),
    });
  }

  private async initializeWorkerSrc(): Promise<void> {
    const workerSrc = await getWorkerSrc(this.config);

    if (workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    }
  }
}
