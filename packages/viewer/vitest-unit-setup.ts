import '../../vitest.setup.console';
import './src/__setup__/polyfills';

import { afterEach, beforeEach } from 'vitest';

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

export {};
