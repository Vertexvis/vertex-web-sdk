import { Dimensions, Point } from '@vertexvis/geometry';

import { MockDocumentApi, mockPanByDelta } from '../../../testing/mock-document-api';
import { PanInteractionHandler } from '../pan-interaction-handler';

describe('PanInteractionHandler', () => {
  let originalWindowAddEventListener: typeof window.addEventListener;
  let originalWindowRemoveEventListener: typeof window.removeEventListener;

  function mockWindowEventListeners(): void {
    Object.defineProperty(window, 'addEventListener', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
  }

  function unmockWindowEventListeners(): void {
    Object.defineProperty(window, 'addEventListener', {
      value: originalWindowAddEventListener,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: originalWindowRemoveEventListener,
      writable: true,
      configurable: true,
    });
  }

  beforeAll(() => {
    originalWindowAddEventListener = window.addEventListener;
    originalWindowRemoveEventListener = window.removeEventListener;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    unmockWindowEventListeners();
  });

  afterAll(() => {
    unmockWindowEventListeners();
  });

  it('should create an instance and bind listeners to the element and window', () => {
    mockWindowEventListeners();

    const mockAddEventListener = jest.fn();
    const element = document.createElement('div');
    const hostElement = document.createElement('div');

    Object.defineProperty(element, 'addEventListener', {
      value: mockAddEventListener,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(hostElement, 'addEventListener', {
      value: mockAddEventListener,
      writable: true,
      configurable: true,
    });

    const handler = new PanInteractionHandler(
      element,
      hostElement,
      new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0), viewport: Dimensions.create(100, 100) }),
    );

    expect(hostElement.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));

    handler.dispose();
  });

  it('should remove listeners when disposed', () => {
    mockWindowEventListeners();

    const mockRemoveEventListener = jest.fn();
    const element = document.createElement('div');
    const hostElement = document.createElement('div');

    Object.defineProperty(element, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(hostElement, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true,
      configurable: true,
    });

    const handler = new PanInteractionHandler(
      element,
      hostElement,
      new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0), viewport: Dimensions.create(100, 100) }),
    );

    handler.dispose();

    expect(hostElement.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
    expect(element.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(element.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
  });

  it('should pan the document when the element is dragged', () => {
    const element = document.createElement('div');

    const handler = new PanInteractionHandler(
      element,
      document.createElement('div'),
      new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0), viewport: Dimensions.create(100, 100) }),
    );

    element.dispatchEvent(new MouseEvent('pointerdown', { button: 2, clientX: 10, clientY: 10 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 15, clientY: 15 }));
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 10, clientY: 10 }));

    expect(mockPanByDelta).toHaveBeenCalledWith(Point.create(5, 5));

    handler.dispose();
  });

  it('should not pan the document when the element is dragged with a different button than the secondary button', () => {
    const element = document.createElement('div');

    const handler = new PanInteractionHandler(
      element,
      document.createElement('div'),
      new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0), viewport: Dimensions.create(100, 100) }),
    );

    element.dispatchEvent(new MouseEvent('pointerdown', { button: 1, clientX: 10, clientY: 10 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 15, clientY: 15 }));
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 10, clientY: 10 }));

    expect(mockPanByDelta).not.toHaveBeenCalled();

    handler.dispose();
  });

  it('should pan the document when a wheel event occurs on the host element', () => {
    const element = document.createElement('div');
    const hostElement = document.createElement('div');

    const handler = new PanInteractionHandler(
      element,
      hostElement,
      new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0), viewport: Dimensions.create(100, 100) }),
    );

    hostElement.dispatchEvent(new Event('wheel', { deltaX: 100, deltaY: 100 } as unknown as EventInit));

    expect(mockPanByDelta).toHaveBeenCalledWith(Point.create(-50, -50));

    handler.dispose();
  });

  it('should continue to pan the document when a wheel event occurs after a pointerup', () => {
    const element = document.createElement('div');
    const hostElement = document.createElement('div');

    const handler = new PanInteractionHandler(
      element,
      hostElement,
      new MockDocumentApi({ zoomPercentage: 100, panOffset: Point.create(0, 0), viewport: Dimensions.create(100, 100) }),
    );

    element.dispatchEvent(new MouseEvent('pointerdown', { button: 2, clientX: 10, clientY: 10 }));
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 10, clientY: 10 }));
    hostElement.dispatchEvent(new Event('wheel', { deltaX: 100, deltaY: 100 } as unknown as EventInit));

    expect(mockPanByDelta).toHaveBeenCalledWith(Point.create(-50, -50));

    handler.dispose();
  });
});
