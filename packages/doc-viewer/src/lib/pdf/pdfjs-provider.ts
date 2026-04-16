import { Config } from '../config';
import { DocumentApi } from '../document/api';
import { DocumentProvider } from '../document/provider';
import { DocumentRenderer } from '../document/renderer';
import { PdfJsApi } from './pdfjs-api';
import { PdfJsRenderer } from './pdfjs-renderer';

export class PdfJsProvider implements DocumentProvider {
  public create(canvas: HTMLCanvasElement, config?: Config): { api: DocumentApi; renderer: DocumentRenderer } {
    const api = new PdfJsApi(config);
    const renderer = new PdfJsRenderer(api, canvas);

    return { api, renderer };
  }
}
