import { renderSpecPage } from '#test/render-spec-page';

import { SceneTreeToolbar } from './scene-tree-toolbar';

describe('scene-tree-toolbar', () => {
  it('renders', async () => {
    const page = await renderSpecPage({
      components: [SceneTreeToolbar],
      html: `<vertex-scene-tree-toolbar></vertex-scene-tree-toolbar>`,
    });
    // CHANGED ASSERTION: Vitest serializes slot elements with explicit closing tags.
    expect(page.root).toEqualHtml(`
      <vertex-scene-tree-toolbar>
        <mock:shadow-root>
        <div class="content">
          <slot name="before"></slot>
        </div>
        <div class="content content-primary">
          <slot></slot>
        </div>
        <div class="content">
          <slot name="after"></slot>
        </div>
        </mock:shadow-root>
      </vertex-scene-tree-toolbar>
    `);
  });
});
