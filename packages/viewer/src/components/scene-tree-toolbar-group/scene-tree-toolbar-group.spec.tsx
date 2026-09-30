import { renderSpecPage } from '#test/render-spec-page';

import { SceneTreeToolbarGroup } from './scene-tree-toolbar-group';

describe('scene-tree-toolbar-group', () => {
  it('renders', async () => {
    const page = await renderSpecPage({
      components: [SceneTreeToolbarGroup],
      html: `<vertex-scene-tree-toolbar-group></vertex-scene-tree-toolbar-group>`,
    });
    expect(page.root).toEqualHtml(`
      <vertex-scene-tree-toolbar-group class="hydrated">
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </vertex-scene-tree-toolbar-group>
    `);
  });
});
