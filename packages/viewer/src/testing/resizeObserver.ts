/* eslint-disable */
export const triggerResizeObserver = jest.fn();
(global as any).ResizeObserver = class {
  private fn;
  constructor(fn: (entries: ResizeObserverEntry[]) => void) {
    this.fn = fn;
  }
  disconnect = jest.fn()
  observe = jest.fn()
  trigger = triggerResizeObserver.mockImplementation((entries: ResizeObserverEntry[]) => this.fn(entries))
};
