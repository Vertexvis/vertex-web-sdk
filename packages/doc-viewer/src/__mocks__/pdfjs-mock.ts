import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';

export class MockOptionalContentConfig extends Map {
  public setVisibility = vi.fn();
}

export const mockGetViewport = vi.fn(() => ({ width: 100, height: 100 }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockPageRender = vi.fn((args: any) => ({ promise: Promise.resolve() }));

export const mockGetPage = vi.fn(() => ({
  getTextContent: vi.fn(() => ({
    items: [],
  })),
  render: mockPageRender,
  getViewport: mockGetViewport,
}));

export const mockDestroy = vi.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockGetDocument = vi.fn((): any => ({
  promise: Promise.resolve(mockPdfDocument),
}));

export const mockPdfDocument = {
  numPages: 10,
  getPage: mockGetPage,
  getOptionalContentConfig: vi.fn(() => Promise.resolve(new MockOptionalContentConfig())),
  destroy: mockDestroy,
} as unknown as PDFDocumentProxy;

export const GlobalWorkerOptions = {
  workerSrc: '',
};

export const getDocument = mockGetDocument;
