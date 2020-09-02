(global as any).MessageEvent = class extends Event {
  public readonly data?: any;

  public constructor(type: string, initDict?: MessageEventInit) {
    super(type);
    this.data = initDict.data;
  }
};

/* eslint-disable */
(global as any).MutationObserver = class {
  constructor(callback) {}
  disconnect() {}
  observe(element, init) {}
};
/* eslint-enable */
