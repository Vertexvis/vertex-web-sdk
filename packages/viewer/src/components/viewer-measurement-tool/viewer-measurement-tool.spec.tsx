import { newSpecPage } from '@stencil/core/testing';
import { ViewerMeasurementTool } from './viewer-measurement-tool';

describe('vertex-viewer-measurement-tool', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [ViewerMeasurementTool],
      html: `<vertex-viewer-measurement-tool></vertex-viewer-measurement-tool>`,
    });
    expect(page.root).toEqualHtml(`
      <viewer-measurement-tool>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </viewer-measurement-tool>
    `);
  });
});
