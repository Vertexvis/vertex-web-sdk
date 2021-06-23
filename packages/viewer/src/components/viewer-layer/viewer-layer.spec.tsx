import { newSpecPage } from '@stencil/core/testing';
import { ViewerLayer } from './viewer-layer';

describe('vertex-viewer-layer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [ViewerLayer],
      html: `<vertex-viewer-layer></vertex-viewer-layer>`,
    });
    expect(page.root).toEqualHtml(`
      <vertex-viewer-layer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </vertex-viewer-layer>
    `);
  });
});
