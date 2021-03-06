import { newSpecPage } from '@stencil/core/testing';
import { ViewerIcon } from './viewer-icon';

describe('<vertex-viewer-icon>', () => {
  it('renders a fit all icon', async () => {
    const page = await newSpecPage({
      components: [ViewerIcon],
      html: `<vertex-viewer-icon name="fit-all"></vertex-viewer-button>`,
    });

    const svg = page.root?.shadowRoot?.querySelector('svg');
    expect(svg?.innerHTML).toContain('path');
  });

  it('sets the correct size class name', async () => {
    const page = await newSpecPage({
      components: [ViewerIcon],
      html: `<vertex-viewer-icon name="fit-all"></vertex-viewer-button>`,
    });

    page.root?.setAttribute('size', 'sm');
    await page.waitForChanges();
    expect(page.root).toHaveClass('size-sm');

    page.root?.setAttribute('size', 'md');
    await page.waitForChanges();
    expect(page.root).toHaveClass('size-md');

    page.root?.setAttribute('size', 'lg');
    await page.waitForChanges();
    expect(page.root).toHaveClass('size-lg');
  });
});
