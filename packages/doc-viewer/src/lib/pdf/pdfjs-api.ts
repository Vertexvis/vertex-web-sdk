import { Dimensions, Point } from '@vertexvis/geometry';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config.d.js';

import { Config } from '../config';
import { DocumentApi, DocumentApiState } from '../document/api';
import { DocumentLayer, LayerSupport } from '../document/layers';
import { fromUri } from '../types/loadableResource';

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
    await this.setupWorkerSrc();

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
    await this.setupWorkerSrc();

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

  private async setupWorkerSrc(): Promise<void> {
    if (this.workerSrcInitialized) {
      return;
    }

    if (this.config?.pdfJs.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = this.config.pdfJs.workerSrc;
      this.workerSrcInitialized = true;
      return;
    } else {
      const srcCandidates = this.getBuildTypeWorkerSrcCandidateProviders();

      for (const srcProvider of srcCandidates) {
        try {
          const src = srcProvider();
          const response = await fetch(src);

          if (response?.ok) {
            pdfjs.GlobalWorkerOptions.workerSrc = src;
            this.workerSrcInitialized = true;
            break;
          }
        } catch (e) {
          // Ignore failures to retrieve the worker source, as some failures may be expected depending on the build type.
        }
      }

      if (!this.workerSrcInitialized) {
        throw new Error('Failed to initialize the worker source.');
      }
    }
  }

  private getBuildTypeWorkerSrcCandidateProviders(): Array<() => string> {
    // There are a number of possible approaches for loading the worker source, and this set of URLs attempts to
    // cover approaches that work for a few different build tools. A config value can be provided to override this
    // behavior, but the default behavior attempts to work with as many build tools as possible.
    // Note that these are set up as providers to prevent exceptions when attempting to create the URL object.
    const relativeUrlBasedStringProvider = (): string => new URL('./assets/pdf.worker.min.mjs', import.meta.url).toString();
    const absolutePathStringProvider = (): string => '/dist/doc-viewer/assets/pdf.worker.min.mjs';
    const parentUrlBasedStringProvider = (): string => new URL('../doc-viewer/assets/pdf.worker.min.mjs', import.meta.url).toString();

    const isEsmBuild = import.meta.url.includes('/dist/esm/');
    const isCustomElementBuild = import.meta.url.includes('/dist/components/');
    const isDistBuild = import.meta.url.includes('/dist/doc-viewer/');

    if (isEsmBuild) {
      return [parentUrlBasedStringProvider, relativeUrlBasedStringProvider, absolutePathStringProvider];
    } else if (isDistBuild) {
      return [absolutePathStringProvider, relativeUrlBasedStringProvider, parentUrlBasedStringProvider];
    } else if (isCustomElementBuild) {
      return [relativeUrlBasedStringProvider, parentUrlBasedStringProvider, absolutePathStringProvider];
    }

    return [relativeUrlBasedStringProvider, parentUrlBasedStringProvider, absolutePathStringProvider];
  }
}
