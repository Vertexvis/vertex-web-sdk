export const mockRenderPage = jest.fn(() => ({ promise: Promise.resolve() }));

export const mockGetViewport = jest.fn(() => ({ width: 100, height: 100 }));

export const mockGetPage = jest.fn(() => ({
  getTextContent: jest.fn(() => ({
    items: [],
  })),
  render: mockRenderPage,
  getViewport: mockGetViewport,
}));

export const mockGetDocument = jest.fn(() => ({
  promise: Promise.resolve({
    numPages: 1,
    getPage: mockGetPage,
    getOptionalContentConfig: jest.fn(),
  }),
}));

jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: mockGetDocument,
}));
