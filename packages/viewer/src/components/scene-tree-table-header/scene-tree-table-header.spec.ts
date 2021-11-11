import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { SceneTreeTableHeader } from './scene-tree-table-header';

describe('<vertex-scene-tree-table-header>', () => {
  it('renders', async () => {
    const { header } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-header>
          label-value
        </vertex-scene-tree-table-header>
      `,
    });

    expect(header.shadowRoot?.querySelector('div.header')).not.toBeNull();
  });
});

async function newComponentSpec(data: {
  html: string;
}): Promise<{ page: SpecPage; header: HTMLVertexSceneTreeTableHeaderElement }> {
  const page = await newSpecPage({
    components: [SceneTreeTableHeader],
    html: data.html,
  });
  const header = page.root as HTMLVertexSceneTreeTableHeaderElement;

  return { page, header };
}
