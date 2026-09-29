import '../../vitest.setup.console';
import './src/__setup__/polyfills';
import './src/__setup__/resize-observer';

// import { Event as HappyDOMEvent } from 'happy-dom';
import { beforeAll } from 'vitest';

beforeAll(async () => {
  // Stencil restores a mock-doc Event constructor in its happy-dom environment.
  // globalThis.Event = HappyDOMEvent as unknown as typeof Event;
});
