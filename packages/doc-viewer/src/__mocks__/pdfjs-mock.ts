import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const mockGetViewport = jest.fn(() => ({ width: 100, height: 100 }));

export const mockPageRender = jest.fn(() => ({ promise: Promise.resolve() }));

export const mockGetPage = jest.fn(() => ({
  getTextContent: jest.fn(() => ({
    items: [],
  })),
  render: mockPageRender,
  getViewport: mockGetViewport,
}));

export const mockDestroy = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockGetDocument = jest.fn((): any => ({
  promise: Promise.resolve(mockPdfDocument),
}));

export const mockPdfDocument = {
  numPages: 10,
  getPage: mockGetPage,
  getOptionalContentConfig: jest.fn(),
  destroy: mockDestroy,
} as unknown as PDFDocumentProxy;

export const GlobalWorkerOptions = {
  workerSrc: '',
};

export const getDocument = mockGetDocument;
