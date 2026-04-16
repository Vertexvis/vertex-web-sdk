import { Config } from '../config';
import { DocumentApi } from './api';
import { DocumentRenderer } from './renderer';

export interface DocumentInterface {
  readonly api: DocumentApi;
  readonly renderer: DocumentRenderer;
}

/**
 * A provider that is responsible for creating an interface for a document. This
 * interface is expected to create a `DocumentApi` and a `DocumentRenderer`, which
 * can be used to perform operations against the document and visualize the resulting
 * image on the provided canvas element.
 */
export interface DocumentProvider {
  create(canvas: HTMLCanvasElement, config?: Config): DocumentInterface;
}
