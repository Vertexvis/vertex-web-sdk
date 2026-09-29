import './vitest-unit-setup';

import { readdirSync } from 'node:fs';

import {
  Event as HappyDOMEvent,
  KeyboardEvent as HappyDOMKeyboardEvent,
  MouseEvent as HappyDOMMouseEvent,
} from 'happy-dom';
import { beforeAll } from 'vitest';

// Some fixtures create nested components without importing their source modules.
// Register the built custom elements so those children can run their lifecycle.
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
