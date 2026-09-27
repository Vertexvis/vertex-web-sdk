import '../../vitest.setup.console';
import './src/__setup__/polyfills';

import { readdirSync } from 'node:fs';

import { afterEach, beforeAll, beforeEach } from 'vitest';

await import('./dist/index.js');

// The Stencil environment retains mock-doc constructors when happy-dom is
// selected. Keep instanceof checks and dispatched events in one DOM realm.
if (window.Event !== globalThis.Event) globalThis.Event = window.Event;
if (window.HTMLTemplateElement !== globalThis.HTMLTemplateElement) {
  globalThis.HTMLTemplateElement = window.HTMLTemplateElement;
}

beforeEach(() => {
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
