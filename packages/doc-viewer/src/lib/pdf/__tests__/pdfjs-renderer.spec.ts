import type { Mock } from '#test/mock-types';

const { mockOnStateChangeDispose, mockOnStateChange, mockCreateElement } = vi.hoisted(() => {
  const mockOnStateChangeDispose = vi.fn();
  return {
    mockOnStateChangeDispose,
    mockOnStateChange: vi.fn<(_handler: (state: PdfJsApiState) => Promise<void>) => { dispose: () => void }>(() => ({ dispose: mockOnStateChangeDispose })),
    mockCreateElement: vi.fn(),
  };
});
vi.mock('../../dom', () => ({
  createElement: mockCreateElement,
}));
vi.mock('../pdfjs-api', () => ({
  PdfJsApi: class {
    public onStateChanged = mockOnStateChange;
    public dispose = vi.fn();
  },
}));

import { Dimensions, Point } from '@vertexvis/geometry';
import { Async } from '@vertexvis/utils';

import { mockGetViewport, mockPageRender, mockPdfDocument } from '../../../__mocks__/pdfjs-mock';
import { PdfJsApi, PdfJsApiState } from '../pdfjs-api';
import { PdfJsRenderer } from '../pdfjs-renderer';

describe('PdfJsRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dispose', () => {
    it('disposes the renderer', () => {
      const renderer = new PdfJsRenderer(new PdfJsApi(), document.createElement('canvas'));
      renderer.dispose();

      expect(mockOnStateChangeDispose).toHaveBeenCalledTimes(1);
    });
  });

  describe('renderPage', () => {
    it('renders the page', async () => {
      const mockContext = { fillStyle: '#000000', fillRect: vi.fn() };

      mockCreateElement.mockImplementation(() => ({ getContext: vi.fn().mockReturnValue(mockContext) }));

      new PdfJsRenderer(new PdfJsApi(), document.createElement('canvas'));
      const handler = mockOnStateChange.mock.calls[0][0];

      await handler({ document: mockPdfDocument, loadedPageNumber: 1, zoomPercentage: 100, panOffset: Point.create(0, 0) });

      const firstCall = mockPageRender.mock.calls[0][0];

      // Expect the fill style to have been updated to `#ffffff` to give the page a white background.
      expect(firstCall?.canvas.getContext('2d')?.fillStyle).toBe('#ffffff');
      expect(firstCall?.viewport.width).toBe(100);
      expect(firstCall?.viewport.height).toBe(100);
    });

    it('scales the page to fit within the viewport', async () => {
      new PdfJsRenderer(new PdfJsApi(), document.createElement('canvas'));
      const handler = mockOnStateChange.mock.calls[0][0];

      (mockGetViewport as Mock).mockImplementation(({ scale }) => ({ width: 100 * scale, height: 100 * scale }));

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
      vi.useFakeTimers();

      new PdfJsRenderer(new PdfJsApi(), document.createElement('canvas'));
      const handler = mockOnStateChange.mock.calls[0][0];

      (mockPageRender as Mock).mockImplementationOnce(() => ({ promise: Async.delay(10000) }));

      handler({ document: mockPdfDocument, loadedPageNumber: 1, zoomPercentage: 100, panOffset: Point.create(0, 0) });

      await handler({ document: mockPdfDocument, loadedPageNumber: 1, zoomPercentage: 100, panOffset: Point.create(0, 0) });

      expect(mockPageRender).toHaveBeenCalledTimes(1);
    });
  });
});
