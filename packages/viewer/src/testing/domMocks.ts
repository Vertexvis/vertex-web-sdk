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

export const triggerResizeObserver = jest.fn();
(global as any).ResizeObserver = class {
  private fn;
  constructor(fn: VoidFunction) {
    this.fn = fn;
  }
  disconnect = jest.fn()
  observe = jest.fn()
  trigger = triggerResizeObserver.mockImplementation(() => this.fn())
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
