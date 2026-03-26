const mockOnStateChangeDispose = jest.fn();
const mockOnStateChange = jest.fn((_handler: (state: PdfJsApiState) => Promise<void>) => ({
  dispose: mockOnStateChangeDispose,
}));
jest.mock('../pdfjs-api', () => ({
  PdfJsApi: jest.fn().mockImplementation(() => ({
    onStateChanged: mockOnStateChange,
    dispose: jest.fn(),
  })),
}));

import { Dimensions, Point } from '@vertexvis/geometry';
import { Async } from '@vertexvis/utils';

import { mockGetViewport, mockPageRender, mockPdfDocument } from '../../../__mocks__/pdfjs-mock';
import { PdfJsApi, PdfJsApiState } from '../pdfjs-api';
import { PdfJsRenderer } from '../pdfjs-renderer';

describe('PdfJsRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('dispose', () => {
    it('disposes the renderer', () => {
      const renderer = new PdfJsRenderer(new PdfJsApi(), new HTMLCanvasElement());
      renderer.dispose();

      expect(mockOnStateChangeDispose).toHaveBeenCalledTimes(1);
    });
  });

  describe('renderPage', () => {
    it('renders the page', async () => {
      new PdfJsRenderer(new PdfJsApi(), new HTMLCanvasElement());
      const handler = mockOnStateChange.mock.calls[0][0];

      await handler({ document: mockPdfDocument, loadedPageNumber: 1, zoomPercentage: 100, panOffset: Point.create(0, 0) });

      expect(mockPageRender).toHaveBeenCalledWith(
        expect.objectContaining({
          canvas: expect.any(HTMLCanvasElement),
          viewport: expect.objectContaining({
            width: 100,
            height: 100,
          }),
        }),
      );
    });

    it('scales the page to fit within the viewport', async () => {
      new PdfJsRenderer(new PdfJsApi(), new HTMLCanvasElement());
      const handler = mockOnStateChange.mock.calls[0][0];

      (mockGetViewport as jest.Mock).mockImplementation(({ scale }) => ({ width: 100 * scale, height: 100 * scale }));

      await handler({ document: mockPdfDocument, loadedPageNumber: 1, viewport: Dimensions.create(10, 10), zoomPercentage: 100, panOffset: Point.create(0, 0) });

      expect(mockPageRender).toHaveBeenCalledWith(
        expect.objectContaining({
          viewport: expect.objectContaining({
            width: 10,
            height: 10,
          }),
        }),
      );
    });

    it('does not render if already rendering', async () => {
      jest.useFakeTimers();

      new PdfJsRenderer(new PdfJsApi(), new HTMLCanvasElement());
      const handler = mockOnStateChange.mock.calls[0][0];

      (mockPageRender as jest.Mock).mockImplementationOnce(() => ({ promise: Async.delay(10000) }));

      handler({ document: mockPdfDocument, loadedPageNumber: 1, zoomPercentage: 100, panOffset: Point.create(0, 0) });

      await handler({ document: mockPdfDocument, loadedPageNumber: 1, zoomPercentage: 100, panOffset: Point.create(0, 0) });

      expect(mockPageRender).toHaveBeenCalledTimes(1);
    });
  });
});
