import './vitest-unit-setup';

import {
  Event as HappyDOMEvent,
  KeyboardEvent as HappyDOMKeyboardEvent,
  MouseEvent as HappyDOMMouseEvent,
} from 'happy-dom';
import { beforeAll } from 'vitest';

beforeAll(() => {
  if ('happyDOM' in window) {
    // Stencil's setup installs mock-doc events even for the happy-dom project.
    globalThis.Event = HappyDOMEvent as unknown as typeof Event;
    globalThis.MouseEvent = HappyDOMMouseEvent as unknown as typeof MouseEvent;
    globalThis.KeyboardEvent =
      HappyDOMKeyboardEvent as unknown as typeof KeyboardEvent;
    globalThis.HTMLTemplateElement = window.HTMLTemplateElement;
    // Happy DOM has no canvas adapter, so getContext('2d') returns null and
    // the viewer drops incoming frames before its frame events can fire.
    Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: (type: string) =>
        type === '2d'
          ? { clearRect: () => undefined, drawImage: () => undefined }
          : null,
    });
  }
});

export {};
