import { newSpecPage } from '@stencil/core/testing';
import { ViewerDistanceMeasurement } from './viewer-distance-measurement';

describe('vertex-viewer-distance-measurement', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [ViewerDistanceMeasurement],
      html: `<vertex-viewer-distance-measurement></vertex-viewer-distance-measurement>`,
    });
    expect(page.root).toEqualHtml(`
      <vertex-viewer-distance-measurement>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </vertex-viewer-distance-measurement>
    `);
  });
});
