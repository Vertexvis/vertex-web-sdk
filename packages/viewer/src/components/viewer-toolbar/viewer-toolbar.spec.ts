import { newSpecPage } from '@stencil/core/testing';
import { ViewerToolbar } from './viewer-toolbar';

describe('<vertex-viewer-toolbar>', () => {
  it('sets the correct placement', async () => {
    const page = await newSpecPage({
      components: [ViewerToolbar],
      html: `<vertex-viewer-toolbar>Test</vertex-viewer-button>`,
    });

    page.root?.setAttribute('placement', 'top-left');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-top');
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-left');

    page.root?.setAttribute('placement', 'top-center');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-top');
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-center');

    page.root?.setAttribute('placement', 'top-right');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-top');
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-right');

    page.root?.setAttribute('placement', 'middle-left');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-middle');
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-left');

    page.root?.setAttribute('placement', 'middle-right');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-middle');
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-right');

    page.root?.setAttribute('placement', 'bottom-left');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-bottom');
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-left');

    page.root?.setAttribute('placement', 'bottom-center');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-bottom');
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-center');

    page.root?.setAttribute('placement', 'bottom-right');
    await page.waitForChanges();
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-bottom');
    expect(page.root?.shadowRoot?.firstChild).toHaveClass('position-right');
  });

  it('sets the correct direction', async () => {
    const page = await newSpecPage({
      components: [ViewerToolbar],
      html: `<vertex-viewer-toolbar>Test</vertex-viewer-button>`,
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
