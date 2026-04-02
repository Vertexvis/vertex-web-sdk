jest.mock('../../types/loadableResource', () => ({
  fromUri: jest.fn(() => ({ resource: { type: 'url', url: 'https' } })),
}));

import { mockDestroy, mockGetDocument, mockGetPage } from '../../../__mocks__/pdfjs-mock';
import { fromUri } from '../../types/loadableResource';
import { PdfJsApi } from '../pdfjs-api';

describe('PdfJsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('loads a PDF by URI if it is a URL', async () => {
      const mockStateChanged = jest.fn();
      const mockPdfDocument = {
        numPages: 1,
        getPage: mockGetPage,
        getOptionalContentConfig: jest.fn(),
      };

      mockGetDocument.mockReturnValueOnce({ promise: Promise.resolve(mockPdfDocument) });

      const api = new PdfJsApi();
      api.onStateChanged(mockStateChanged);
      await api.load('https');

      expect(mockStateChanged).toHaveBeenCalledWith(expect.objectContaining({ document: mockPdfDocument }));
    });

    it('throws an error if the URI is not a URL', async () => {
      (fromUri as jest.Mock).mockReturnValueOnce({ resource: { type: 'invalid' } });

      const api = new PdfJsApi();

      await expect(api.load('urn:file:file-id')).rejects.toThrow('Invalid resource URI provided. Expected a URL to retrieve a PDF.');
    });
  });

  describe('loadPage', () => {
    it('loads a page by number', async () => {
      const mockStateChanged = jest.fn();
      const mockContentDimensions = { width: 100, height: 100 };

      (mockGetPage as jest.Mock).mockReturnValueOnce({ getViewport: jest.fn(() => mockContentDimensions) });

      const api = new PdfJsApi();
      api.onStateChanged(mockStateChanged);
      await api.load('https');
      await api.loadPage(1);

      expect(mockStateChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          loadedPageNumber: 1,
          contentDimensions: mockContentDimensions,
        }),
      );
    });

    it('throws an error if the page number is less than 1', async () => {
      const api = new PdfJsApi();
      await api.load('https');

      await expect(api.loadPage(0)).rejects.toThrow('Unable to load page 0. The provided page number must be greater than 0.');
    });

    it('throws an error if the page number is greater than the total number of pages in the document', async () => {
      const api = new PdfJsApi();
      await api.load('https');

      await expect(api.loadPage(100)).rejects.toThrow('Unable to load page 100. The document only has 10 page(s).');
    });
  });

  describe('dispose', () => {
    it('disposes the API', async () => {
      const api = new PdfJsApi();
      await api.load('https');
      api.dispose();

      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });
  });
});
