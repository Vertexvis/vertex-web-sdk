import { newSpecPage } from '@stencil/core/testing';

import { ViewerToolbarGroup } from './viewer-toolbar-group';

describe('<vertex-viewer-toolbar>', () => {
  it('sets the correct direction', async () => {
    const page = await newSpecPage({
      components: [ViewerToolbarGroup],
      html: `<vertex-viewer-toolbar-group>Test</vertex-viewer-button>`,
    });

    page.root?.setAttribute('direction', 'horizontal');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.querySelector('.inner')).toHaveClass(
      'horizontal'
    );

    page.root?.setAttribute('direction', 'vertical');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.querySelector('.inner')).toHaveClass(
      'vertical'
    );
  });
});
