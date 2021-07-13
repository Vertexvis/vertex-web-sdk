import { newSpecPage } from '@stencil/core/testing';
import { SceneTreeToolbar } from './scene-tree-toolbar';

describe('scene-tree-toolbar', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [SceneTreeToolbar],
      html: `<vertex-scene-tree-toolbar></vertex-scene-tree-toolbar>`,
    });
    expect(page.root).toEqualHtml(`
      <vertex-scene-tree-toolbar>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </vertex-scene-tree-toolbar>
    `);
  });
});
