// This file contains imports for any browser polyfills that are needed by
// tests.

import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';

import { ResizeObserver } from 'resize-observer';

/* eslint-disable */
(global as any).ResizeObserver = ResizeObserver;

(global as any).MessageEvent = class extends Event {
  public readonly data?: any;

  public constructor(type: string, initDict?: MessageEventInit) {
    super(type);
    this.data = initDict?.data;
  }
};

(global as any).CloseEvent = class extends Event {
  public readonly code?: number;
  public readonly reason?: string;

  public constructor(type: string, initDict?: CloseEventInit) {
    super(type);
    this.code = initDict?.code;
    this.reason = initDict?.reason;
  }
};

(global as any).MutationObserver = class {
  constructor() {}
  disconnect() {}
  observe() {}
};

(global as any).IntersectionObserver = class {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
