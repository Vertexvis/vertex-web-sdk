/* eslint-disable */
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
