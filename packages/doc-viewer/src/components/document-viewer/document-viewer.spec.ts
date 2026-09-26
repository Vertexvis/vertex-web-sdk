import type { Mock } from '#test/mock-types';
vi.mock('../../lib/dom', async () => {
  const original = await vi.importActual('../../lib/dom');

  return {
    ...original,
    getAllVertexElementChildren: vi.fn(() => []),
  };
});

import { Async } from '@vertexvis/utils';

import { renderSpecPage } from '#test/render-spec-page';

import { mockGetDocument, mockGetPage, mockGetViewport, mockPageRender } from '../../__mocks__/pdfjs-mock';
import { triggerResizeObserver } from '../../__setup__/resize-observer';
import { getAllVertexElementChildren } from '../../lib/dom';
import { VertexDocumentViewer } from './document-viewer';

describe('vertex-document-viewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves the document specified by the src property and loads the first page', async () => {
    const mockSrc = 'https://vertex3d.com';

    await renderSpecPage({
      components: [VertexDocumentViewer],
      html: `<vertex-document-viewer src="${mockSrc}"></vertex-document-viewer>`,
    });

    expect(mockGetDocument).toHaveBeenCalledWith(mockSrc);
    expect(mockGetPage).toHaveBeenCalledWith(1);
    expect(mockPageRender).toHaveBeenCalled();
  });

  it('updates dimensions when the the element is resized', async () => {
    const mockSrc = 'https';

    const { root } = await renderSpecPage({
      components: [VertexDocumentViewer],
      html: `<vertex-document-viewer src="${mockSrc}" resize-debounce="0"></vertex-document-viewer>`,
    });

    const viewer = root as HTMLVertexDocumentViewerElement;

    viewer.resizeDebounce = 0;

    // Three expected calls represent:
    // - Initial loading of the base document viewport and storage in the API
    // - Retrieval of the document viewport when rendering the first page
    // - Retrieval of the document viewport with a scalar based on the viewer viewport
    expect(mockGetViewport).toHaveBeenCalledTimes(3);
    expect(mockGetViewport).toHaveBeenCalledWith(expect.objectContaining({ scale: 1 }));
    expect(mockPageRender).toHaveBeenCalledWith(
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

    expect(mockGetViewport).toHaveBeenCalledTimes(5);
    expect(mockGetViewport).toHaveBeenCalledWith(expect.objectContaining({ scale: 0.25 }));
    expect(mockPageRender).toHaveBeenCalledWith(
      expect.objectContaining({
        viewport: expect.objectContaining({
          width: 25,
          height: 25,
        }),
      }),
    );
  });

  describe('loadPage', () => {
    it('loads a page by number', async () => {
      const mockSrc = 'https';

      const { root } = await renderSpecPage({
        components: [VertexDocumentViewer],
        html: `<vertex-document-viewer src="${mockSrc}"></vertex-document-viewer>`,
      });

      const viewer = root as HTMLVertexDocumentViewerElement;
      await viewer.loadPage(5);

      expect(mockGetPage).toHaveBeenCalledWith(5);
      expect(mockPageRender).toHaveBeenCalled();
    });

    it('throws an error if no document has been loaded and the API is not defined', async () => {
      const { root } = await renderSpecPage({
        components: [VertexDocumentViewer],
        html: '<vertex-document-viewer></vertex-document-viewer>',
      });

      const viewer = root as HTMLVertexDocumentViewerElement;
      await expect(viewer.loadPage(1)).rejects.toThrow('No document has been loaded. Ensure that the `src` property is set and the resource is accessible.');
    });
  });

  describe('injectViewerApi', () => {
    it('injects the viewer API into vertex custom element children', async () => {
      const testElement = { nodeName: 'VERTEX-VIEWER-MARKUP', viewer: undefined };
      (getAllVertexElementChildren as Mock).mockReturnValue([testElement]);

      const page = await renderSpecPage({
        components: [VertexDocumentViewer],
        html: `<vertex-document-viewer></vertex-document-viewer>`,
      });

      await page.waitForChanges();

      expect(testElement.viewer).toBeDefined();
    });
  });
});
