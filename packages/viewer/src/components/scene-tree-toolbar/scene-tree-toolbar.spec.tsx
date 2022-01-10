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
        <div class="content">
          <slot name="before" />
        </div>
        <div class="content content-primary">
          <slot />
        </div>
        <div class="content">
          <slot name="after" />
        </div>
        </mock:shadow-root>
      </vertex-scene-tree-toolbar>
    `);
  });
});
