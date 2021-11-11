import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { SceneTreeTableColumn } from './scene-tree-table-column';

describe('<vertex-scene-tree-table-column>', () => {
  it('renders', async () => {
    const { column } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-column>
          <div id="cell" />
        </vertex-scene-tree-table-column>
      `,
    });

    expect(column.shadowRoot?.querySelector('div.column')).not.toBeNull();
    expect(column.shadowRoot?.querySelector('div.hidden')).not.toBeNull();
  });
});

async function newComponentSpec(data: {
  html: string;
}): Promise<{ page: SpecPage; column: HTMLVertexSceneTreeTableColumnElement }> {
  const page = await newSpecPage({
    components: [SceneTreeTableColumn],
    html: data.html,
  });
  const column = page.root as HTMLVertexSceneTreeTableColumnElement;

  return { page, column };
}
