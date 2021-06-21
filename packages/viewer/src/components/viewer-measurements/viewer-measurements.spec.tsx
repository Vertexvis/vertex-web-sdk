import { newSpecPage } from '@stencil/core/testing';
import { ViewerMeasurements } from './viewer-measurements';

describe('vertex-viewer-measurements', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurements],
      html: `<vertex-viewer-measurements></vertex-viewer-measurements>`,
    });
    expect(page.root).toEqualHtml(`
      <vertex-viewer-measurements>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </vertex-viewer-measurements>
    `);
  });
});
