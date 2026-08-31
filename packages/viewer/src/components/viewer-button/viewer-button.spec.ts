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
    // The button should not have an aria-label attribute since not provided
    expect(btn).not.toHaveAttribute('aria-label');
    expect(slot).toBeDefined();
  });

  it('forwards its accessible name to the internal button', async () => {
    const page = await newSpecPage({
      components: [ViewerButton],
      html: `<vertex-viewer-button aria-label="Fit all"></vertex-viewer-button>`,
    });

    const btn = page.root?.shadowRoot?.querySelector('button');
    expect(btn).toEqualAttribute('aria-label', 'Fit all');
  });
});
