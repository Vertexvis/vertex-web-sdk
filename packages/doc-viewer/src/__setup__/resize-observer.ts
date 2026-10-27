/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Mock, vi } from 'vitest';

export const triggerResizeObserver: Mock = vi.fn();
(globalThis as any).ResizeObserver = class {
  private fn;

  public disconnect = vi.fn();
  public observe = vi.fn();
  public trigger = triggerResizeObserver.mockImplementation((entries: ResizeObserverEntry[]) => this.fn(entries));

  public constructor(fn: (entries: ResizeObserverEntry[]) => void) {
    this.fn = fn;
  }
};
