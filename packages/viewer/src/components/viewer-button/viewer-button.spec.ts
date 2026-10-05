import './viewer-button';

import { render } from '@stencil/vitest';

describe('<vertex-viewer-button>', () => {
  it('contains a button with a slot for content', async () => {
    const page = await render(
      '<vertex-viewer-button>Test</vertex-viewer-button>',
      { waitForReady: false },
    );
    await page.waitForChanges();

    const btn = page.root?.shadowRoot?.querySelector('button');
    const slot = btn?.querySelector('slot');
    expect(btn).toBeDefined();
    // The button should not have an aria-label attribute since not provided
    expect(btn).not.toHaveAttribute('aria-label');
    expect(slot).toBeDefined();
  });

  it('forwards its accessible name to the internal button', async () => {
    const page = await render(
      '<vertex-viewer-button aria-label="Fit all"></vertex-viewer-button>',
      { waitForReady: false },
    );
    await page.waitForChanges();

    const btn = page.root?.shadowRoot?.querySelector('button');
    expect(btn).toEqualAttribute('aria-label', 'Fit all');
  });
});
