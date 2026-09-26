/* eslint-disable @typescript-eslint/no-explicit-any */
export const triggerResizeObserver = vi.fn();
(globalThis as any).ResizeObserver = class {
  private fn;

  public disconnect = vi.fn();
  public observe = vi.fn();
  public trigger = triggerResizeObserver.mockImplementation((entries: ResizeObserverEntry[]) => this.fn(entries));

  public constructor(fn: (entries: ResizeObserverEntry[]) => void) {
    this.fn = fn;
  }
};
