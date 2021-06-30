import { newSpecPage } from '@stencil/core/testing';
import { ViewerMeasurementLine } from './viewer-measurement-line';

describe('vertex-viewer-measurement-line', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementLine],
      html: `<vertex-viewer-measurement-line></vertex-viewer-measurement-line>`,
    });
    expect(page.root).toEqualHtml(`
      <vertex-viewer-measurement-line>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </vertex-viewer-measurement-line>
    `);
  });
});
