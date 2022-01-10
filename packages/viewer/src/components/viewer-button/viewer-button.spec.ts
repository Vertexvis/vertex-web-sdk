import { newSpecPage } from '@stencil/core/testing';

import { ViewerButton } from './viewer-button';

describe('<vertex-viewer-button>', () => {
  it('contains a button with a slot for content', async () => {
    const page = await newSpecPage({
      components: [ViewerButton],
      html: `<vertex-viewer-button>Test</vertex-viewer-button>`,
    });

    const btn = page.root?.shadowRoot?.querySelector('button');
    const slot = btn?.querySelector('slot');
    expect(btn).toBeDefined();
    expect(slot).toBeDefined();
  });
});
