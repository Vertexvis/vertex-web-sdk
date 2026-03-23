/* eslint-disable @typescript-eslint/no-explicit-any */
export const triggerResizeObserver = jest.fn();
(global as any).ResizeObserver = class {
  private fn;

  public disconnect = jest.fn();
  public observe = jest.fn();
  public trigger = triggerResizeObserver.mockImplementation((entries: ResizeObserverEntry[]) => this.fn(entries));

  public constructor(fn: (entries: ResizeObserverEntry[]) => void) {
    this.fn = fn;
  }
};
