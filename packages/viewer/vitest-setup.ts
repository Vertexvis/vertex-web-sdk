import '../../vitest.setup.console';
import './src/__setup__/polyfills';

import { readdirSync } from 'node:fs';

import {
  Event as HappyDOMEvent,
  KeyboardEvent as HappyDOMKeyboardEvent,
  MouseEvent as HappyDOMMouseEvent,
} from 'happy-dom';
import { afterEach, beforeAll, beforeEach } from 'vitest';

await import('./dist/index.js');

beforeEach(() => {
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
  document.body.innerHTML = '';
});

// Ensure the last test in a file also tears down any mounted components.
// Components that register a ResizeObserver/MutationObserver in
// componentDidLoad rely on disconnectedCallback to disconnect it. `render()`
// only removes the *previous* stage on the next call, so without this the
// final test's element -- and its observers -- stay alive after the file's
// mock window is torn down, leaving a dangling `requestAnimationFrame` loop
// that later throws `window is not defined`.
afterEach(() => {
  Array.from(document.body.children).forEach((child) => child.remove());
});

beforeAll(async () => {
  const components = new URL('./dist/components/', import.meta.url);
  for (const file of readdirSync(components).filter((name) =>
    /^vertex-.*\.js$/.test(name),
  )) {
    const tag = file.slice(0, -3);
    if (customElements.get(tag)) continue;
    const { defineCustomElement } = await import(
      /* @vite-ignore */ new URL(file, components).href
    );
    defineCustomElement();
  }
});

export {};
