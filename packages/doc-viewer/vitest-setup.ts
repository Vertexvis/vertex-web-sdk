import '../../vitest.setup.console';
import './src/__setup__/polyfills';
import './src/__setup__/resize-observer';

import { readdirSync } from 'node:fs';

import { beforeAll } from 'vitest';

beforeAll(async () => {
  const components = new URL('./dist/components/', import.meta.url);
  for (const file of readdirSync(components).filter(name => /^vertex-.*\.js$/.test(name))) {
    const tag = file.slice(0, -3);
    if (customElements.get(tag)) continue;
    const { defineCustomElement } = await import(/* @vite-ignore */ new URL(file, components).href);
    defineCustomElement();
  }
});
