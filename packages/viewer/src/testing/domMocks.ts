jest.mock('@juggle/resize-observer', () => ({
  ResizeObserver: jest.fn(() => {
    return {
      observe: jest.fn(),
      disconnect: jest.fn(),
    };
  }),
}));

/* eslint-disable */
(global as any).MessageEvent = class extends Event {
  public readonly data?: any;

  public constructor(type: string, initDict?: MessageEventInit) {
    super(type);
    this.data = initDict?.data;
  }
};


(global as any).MutationObserver = class {
  constructor() {}
  disconnect() {}
  observe() {}
};

(global as any).ResizeObserver = class {
  constructor() {}
  disconnect() {}
  observe() {}
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
