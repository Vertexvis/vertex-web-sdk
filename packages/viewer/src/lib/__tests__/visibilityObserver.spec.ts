import type { Mock } from '#test/mock-types';

import { VisibilityObserver } from '../visibilityObserver';

function createObserver(): {
  observer: VisibilityObserver;
  callback: Mock;
} {
  const callback = vi.fn();

  return { observer: new VisibilityObserver(callback), callback };
}

function createMockElement(partial?: Partial<HTMLElement>): HTMLElement {
  return {
    ...partial,
  } as unknown as HTMLElement;
}

describe('VisibilityObserver', () => {
  const mutationDisconnect = vi.fn();
  const mutationObserve = vi.fn();
  const mutationObserverConstructor = vi.fn();
  let baseMutationObserver: typeof MutationObserver;
  let mutationObserverCallback: VoidFunction;

  beforeAll(() => {
    baseMutationObserver = global.MutationObserver;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    (global as any).MutationObserver = class {
      public disconnect = mutationDisconnect;
      public observe = mutationObserve;
      public constructor(callback: VoidFunction) {
        mutationObserverConstructor(callback);
        mutationObserverCallback = callback;
      }
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  afterAll(() => {
    global.MutationObserver = baseMutationObserver;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supports checking for visibility of an element', () => {
    const { observer } = createObserver();
    const mockElement1 = createMockElement({
      checkVisibility: vi.fn(() => true),
    });
    const mockElement2 = createMockElement({
      checkVisibility: vi.fn(() => false),
    });

    expect(observer.isVisible(mockElement1)).toBe(true);
    expect(observer.isVisible(mockElement2)).toBe(false);
  });

  it('always returns true if the checkVisibility API is unavailable', () => {
    const { observer } = createObserver();
    const mockElement = createMockElement();

    expect(observer.isVisible(mockElement)).toBe(true);
  });

  describe('MutationObservers', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('observes the class and style changes of the element and its parents', () => {
      const { observer } = createObserver();
      const mockElement1 = createMockElement({
        checkVisibility: vi.fn(() => false),
      });
      const mockElement2 = createMockElement({
        checkVisibility: vi.fn(() => false),
        parentElement: mockElement1,
      });
      const mockElement3 = createMockElement({
        checkVisibility: vi.fn(() => false),
        parentElement: mockElement2,
      });
      const mockElement4 = createMockElement({
        checkVisibility: vi.fn(() => false),
        parentElement: mockElement3,
      });
      const mockElement5 = createMockElement({
        checkVisibility: vi.fn(() => false),
        parentElement: mockElement4,
      });

      observer.observe(mockElement5);

      expect(mutationObserve).toHaveBeenCalledWith(
        mockElement1,
        expect.objectContaining({
          attributes: true,
          attributeFilter: ['style', 'class', 'hidden'],
        }),
      );
      expect(mutationObserve).toHaveBeenCalledWith(
        mockElement2,
        expect.objectContaining({
          attributes: true,
          attributeFilter: ['style', 'class', 'hidden'],
        }),
      );
      expect(mutationObserve).toHaveBeenCalledWith(
        mockElement3,
        expect.objectContaining({
          attributes: true,
          attributeFilter: ['style', 'class', 'hidden'],
        }),
      );
      expect(mutationObserve).toHaveBeenCalledWith(
        mockElement4,
        expect.objectContaining({
          attributes: true,
          attributeFilter: ['style', 'class', 'hidden'],
        }),
      );
      expect(mutationObserve).toHaveBeenCalledWith(
        mockElement5,
        expect.objectContaining({
          attributes: true,
          attributeFilter: ['style', 'class', 'hidden'],
        }),
      );
    });

    it('emits a visibility change if a mutation observer is triggered', () => {
      const { observer, callback } = createObserver();
      const mockElement = createMockElement({
        checkVisibility: vi.fn(() => true),
      });

      observer.observe(mockElement);
      mutationObserverCallback();

      expect(callback).toHaveBeenCalledWith(true);
    });

    it('disconnects mutation observers on disconnect', () => {
      const { observer } = createObserver();
      const mockElement1 = createMockElement({
        checkVisibility: vi.fn(() => false),
      });
      const mockElement2 = createMockElement({
        checkVisibility: vi.fn(() => false),
        parentElement: mockElement1,
      });

      observer.observe(mockElement2);
      observer.disconnect();

      expect(mutationDisconnect).toHaveBeenCalledTimes(2);
    });
  });
});
