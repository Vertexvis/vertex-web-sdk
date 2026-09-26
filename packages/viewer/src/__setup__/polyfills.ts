// This file contains imports for any browser polyfills that are needed by
// tests.

import { ResizeObserver } from 'resize-observer';

/* eslint-disable @typescript-eslint/no-explicit-any */
(globalThis as any).ResizeObserver = ResizeObserver;

// The Stencil mock-doc environment replaces the global `Event` constructor.
// Node's built-in MessageEvent/CloseEvent are defined lazily on first access,
// and bind to whatever `Event` is global at that time. If that first access
// happens after mock-doc's Event has been installed, Node's own
// MessageEvent/CloseEvent end up extending mock-doc's MockEvent, whose
// constructor does `Object.assign(this, eventInitDict)` -- which throws,
// because `code`/`reason`/`data` are getter-only accessors on the native
// prototypes. Defining our own minimal versions here avoids ever touching
// Node's native constructors in this environment.
(globalThis as any).MessageEvent = class extends Event {
  public readonly data?: any;

  public constructor(type: string, initDict?: MessageEventInit) {
    super(type);
    this.data = initDict?.data;
  }
};

(globalThis as any).CloseEvent = class extends Event {
  public readonly code?: number;
  public readonly reason?: string;

  public constructor(type: string, initDict?: CloseEventInit) {
    super(type);
    this.code = initDict?.code;
    this.reason = initDict?.reason;
  }
};

(globalThis as any).MutationObserver = class {
  public constructor() {}
  public disconnect(): void {}
  public observe(): void {}
};
