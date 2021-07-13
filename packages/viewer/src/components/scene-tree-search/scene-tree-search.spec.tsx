import { newSpecPage } from '@stencil/core/testing';
import { SceneTreeFilter } from './scene-tree-filter';

describe('scene-tree-filter', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [SceneTreeFilter],
      html: `<scene-tree-filter></scene-tree-filter>`,
    });
    expect(page.root).toEqualHtml(`
      <scene-tree-filter>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </scene-tree-filter>
    `);
  });
});
