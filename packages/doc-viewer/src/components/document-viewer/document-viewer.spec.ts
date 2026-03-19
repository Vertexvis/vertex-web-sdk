import { newSpecPage } from '@stencil/core/testing';
import { Async } from '@vertexvis/utils';

import { mockGetDocument, mockGetPage, mockGetViewport, mockRenderPage } from '../../__mocks__/pdfjs-mock';
import { triggerResizeObserver } from '../../__setup__/resize-observer';
import { VertexDocumentViewer } from './document-viewer';

describe('vertex-document-viewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [VertexDocumentViewer],
      html: '<vertex-document-viewer></vertex-document-viewer>',
    });

    expect(root).toEqualHtml(`
      <vertex-document-viewer>
        <mock:shadow-root>
          <div class="viewer-container">
            <div class="canvas-container">
              <canvas></canvas>
            </div>
          </div>
        </mock:shadow-root>
      </vertex-document-viewer>
    `);
  });

  it('retrieves the document specified by the src property and loads the first page', async () => {
    const mockSrc = 'https://vertex3d.com';

    await newSpecPage({
      components: [VertexDocumentViewer],
      html: `<vertex-document-viewer src="${mockSrc}"></vertex-document-viewer>`,
    });

    expect(mockGetDocument).toHaveBeenCalledWith(mockSrc);
    expect(mockGetPage).toHaveBeenCalledWith(1);
    expect(mockRenderPage).toHaveBeenCalled();
  });

  it('updates dimensions when the the element is resized', async () => {
    const mockSrc = 'https://vertex3d.com';

    const { root } = await newSpecPage({
      components: [VertexDocumentViewer],
      html: `<vertex-document-viewer src="${mockSrc}" resize-debounce="0"></vertex-document-viewer>`,
    });

    const viewer = root as HTMLVertexDocumentViewerElement;

    viewer.resizeDebounce = 0;

    expect(mockGetViewport).toHaveBeenCalledTimes(2);
    expect(mockGetViewport).toHaveBeenCalledWith(expect.objectContaining({ scale: 1 }));
    expect(mockRenderPage).toHaveBeenCalledWith(
      expect.objectContaining({
        viewport: expect.objectContaining({
          width: 100,
          height: 100,
        }),
      }),
    );

    mockGetViewport.mockReturnValueOnce({ height: 100, width: 100 });
    mockGetViewport.mockReturnValueOnce({ height: 25, width: 25 });
    triggerResizeObserver([
      {
        contentRect: { width: 25, height: 25 },
      },
    ]);
    await Async.delay(1);

    expect(mockGetViewport).toHaveBeenCalledTimes(4);
    expect(mockGetViewport).toHaveBeenCalledWith(expect.objectContaining({ scale: 0.25 }));
    expect(mockRenderPage).toHaveBeenCalledWith(
      expect.objectContaining({
        viewport: expect.objectContaining({
          width: 25,
          height: 25,
        }),
      }),
    );
  });
});
