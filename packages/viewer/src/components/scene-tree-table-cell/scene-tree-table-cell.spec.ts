import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import Chance from 'chance';
import { SceneTreeTableCell } from './scene-tree-table-cell';

const random = new Chance();

describe('<vertex-scene-tree-table-cell>', () => {
  it('renders empty element if node is undefined', async () => {
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>`,
    });

    expect(cell.shadowRoot?.querySelector('.root')).toBeFalsy();
  });

  it('renders cell with the specified value', async () => {
    const node = createNode();
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell value="${node.name}"></vertex-scene-tree-table-cell>`,
      node,
    });

    const content = cell.shadowRoot?.querySelector('.content');
    expect(content?.textContent).toBe(node.name);
  });

  it('includes is-filter-hit attribute if the node is a filter hit', async () => {
    const node = createNode({ filterHit: true });
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell value="${node.name}"></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell.getAttribute('is-filter-hit')).toBe('');
  });

  it('renders expand icon if expand toggle is true and item is expanded', async () => {
    const node = createNode({ expanded: true, isLeaf: false });
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell expand-toggle></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell.shadowRoot?.querySelector('.icon-expanded')).toBeDefined();
  });

  it('renders collapse icon if expand toggle is true and item is collapsed', async () => {
    const node = createNode({ expanded: false, isLeaf: false });
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell expand-toggle></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell.shadowRoot?.querySelector('.icon-collapsed')).toBeDefined();
  });

  it('does not render expand or collapse icon if leaf', async () => {
    const node = createNode({ isLeaf: true });
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell expand-toggle></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell.shadowRoot?.querySelector('.icon-collapsed')).toBeFalsy();
    expect(cell.shadowRoot?.querySelector('.icon-expanded')).toBeFalsy();
  });

  it('renders visible icon if visibility toggle is true and item is visible', async () => {
    const node = createNode({ visible: true });
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell visibility-toggle></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell).not.toHaveAttribute('is-hidden');
    expect(cell.shadowRoot?.querySelector('.icon-visible')).toBeDefined();
  });

  it('renders hidden icon if visibility toggle is true and item is hidden', async () => {
    const node = createNode({ visible: false });
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell visibility-toggle></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell).toHaveAttribute('is-hidden');
    expect(cell.shadowRoot?.querySelector('.icon-hidden')).toBeDefined();
  });

  it('renders partial icon if visibility toggle is true and item is partially visible', async () => {
    const node = createNode({ partiallyVisible: true });
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell visibility-toggle></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell).toHaveAttribute('is-partial');
    expect(cell.shadowRoot?.querySelector('.icon-partial')).toBeDefined();
  });

  it('toggles expansion', async () => {
    const node = createNode({ expanded: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell expand-toggle></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { toggleExpandItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const expandToggled = jest.fn();
    cell.addEventListener('expandToggled', expandToggled);

    const expandBtn = cell.shadowRoot?.querySelector('.expand-btn');
    const originalEvent = new MouseEvent('pointerdown');
    expandBtn?.dispatchEvent(originalEvent);

    expect(tree.toggleExpandItem).toHaveBeenCalled();
    expect(expandToggled).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          originalEvent,
        }),
      })
    );
  });

  it('does not expands cell if interaction disabled', async () => {
    const node = createNode({ expanded: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell interactions-disabled expand-toggle>
        </vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { toggleExpandItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const expandToggled = jest.fn();
    cell.addEventListener('expandToggled', expandToggled);

    const expandBtn = cell.shadowRoot?.querySelector('.expand-btn');
    expandBtn?.dispatchEvent(new MouseEvent('pointerdown'));

    expect(tree.toggleExpandItem).not.toHaveBeenCalled();
    expect(expandToggled).toHaveBeenCalled();
  });

  it('toggles visibility', async () => {
    const node = createNode({ visible: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell visibility-toggle></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { toggleItemVisibility: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const visibilityToggled = jest.fn();
    cell.addEventListener('visibilityToggled', visibilityToggled);

    const expandBtn = cell.shadowRoot?.querySelector('.visibility-btn');
    const originalEvent = new MouseEvent('pointerdown');
    expandBtn?.dispatchEvent(originalEvent);

    expect(tree.toggleItemVisibility).toHaveBeenCalled();
    expect(visibilityToggled).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          originalEvent,
        }),
      })
    );
  });

  it('does not toggle visibility cell if interaction disabled', async () => {
    const node = createNode({ visible: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell interactions-disabled visibility-toggle>
        </vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { toggleItemVisibility: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const visibilityToggled = jest.fn();
    cell.addEventListener('visibilityToggled', visibilityToggled);

    const expandBtn = cell.shadowRoot?.querySelector('.visibility-btn');
    expandBtn?.dispatchEvent(new MouseEvent('pointerdown'));

    expect(tree.toggleItemVisibility).not.toHaveBeenCalled();
    expect(visibilityToggled).toHaveBeenCalled();
  });

  it('selects cell if unselected', async () => {
    const node = createNode({ selected: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { selectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const selected = jest.fn();
    cell.addEventListener('selectionToggled', selected);

    const originalEvent = new MouseEvent('pointerdown', { button: 0 });
    cell.dispatchEvent(originalEvent);

    expect(tree.selectItem).toHaveBeenCalled();
    expect(selected).toHaveBeenCalled();
    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          originalEvent,
        }),
      })
    );
  });

  it('appends selection if unselected and meta key', async () => {
    const node = createNode({ selected: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { selectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const selected = jest.fn();
    cell.addEventListener('selectionToggled', selected);

    const originalEvent = new MouseEvent('pointerdown', {
      button: 0,
      metaKey: true,
    });
    cell.dispatchEvent(originalEvent);

    expect(tree.selectItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ append: true })
    );
    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          originalEvent,
        }),
      })
    );
  });

  it('appends selection if unselected and ctrl key', async () => {
    const node = createNode({ selected: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { selectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const selected = jest.fn();
    cell.addEventListener('selectionToggled', selected);

    cell.dispatchEvent(
      new MouseEvent('pointerdown', { button: 0, ctrlKey: true })
    );

    expect(tree.selectItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ append: true })
    );
    expect(selected).toHaveBeenCalled();
  });

  it('recursively selects parents if selected', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { selectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    cell.dispatchEvent(new MouseEvent('pointerdown', { button: 0 }));

    expect(tree.selectItem).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ recurseParent: true })
    );
  });

  it('does nothing if selected and recursive selection disabled', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell recurse-parent-selection-disabled></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { selectItem: jest.fn(), deselectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    cell.dispatchEvent(new MouseEvent('pointerdown', { button: 0 }));

    expect(tree.selectItem).not.toHaveBeenCalled();
    expect(tree.deselectItem).not.toHaveBeenCalled();
  });

  it('deselects if selected and meta key', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { deselectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const selected = jest.fn();
    cell.addEventListener('selectionToggled', selected);

    cell.dispatchEvent(
      new MouseEvent('pointerdown', { button: 0, metaKey: true })
    );

    expect(tree.deselectItem).toHaveBeenCalled();
    expect(selected).toHaveBeenCalled();
  });

  it('deselects if selected and ctrl key', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { deselectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const selected = jest.fn();
    cell.addEventListener('selectionToggled', selected);

    const originalEvent = new MouseEvent('pointerdown', {
      button: 0,
      ctrlKey: true,
    });
    cell.dispatchEvent(originalEvent);

    expect(tree.deselectItem).toHaveBeenCalled();
    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          originalEvent,
        }),
      })
    );
  });

  it('does not select if event default behavior prevented', async () => {
    const node = createNode({ selected: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = {};

    const selected = jest.fn();
    cell.addEventListener('selected', selected);

    const event = new MouseEvent('pointerdown', { button: 0, metaKey: true });
    event.preventDefault();
    cell.dispatchEvent(event);

    expect(selected).not.toHaveBeenCalled();
  });

  it('dispatches hover events when a pointer enters the cell', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const hovered = jest.fn();
    cell.addEventListener('hovered', hovered);

    const originalEvent = new MouseEvent('pointerenter');
    cell.dispatchEvent(originalEvent);

    expect(hovered).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          node,
          originalEvent,
        },
      })
    );
  });

  it('dispatches hover events when a pointer leaves the cell', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const hovered = jest.fn();
    cell.addEventListener('hovered', hovered);

    const originalEvent = new MouseEvent('pointerenter');
    cell.dispatchEvent(originalEvent);
    cell.dispatchEvent(new MouseEvent('pointerleave'));

    expect(hovered).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          node,
          originalEvent,
        },
      })
    );

    expect(hovered).toHaveBeenCalledWith(
      expect.objectContaining({ detail: undefined })
    );
  });
});

async function newComponentSpec(data: {
  html: string;
  node?: Node.AsObject;
}): Promise<{ page: SpecPage; cell: HTMLVertexSceneTreeTableCellElement }> {
  const page = await newSpecPage({
    components: [SceneTreeTableCell],
    html: data.html,
  });
  const cell = page.root as HTMLVertexSceneTreeTableCellElement;

  if (data.node != null) {
    cell.node = data.node;
    await page.waitForChanges();
  }

  return { page, cell };
}

function createNode(values: Partial<Node.AsObject> = {}): Node.AsObject {
  return {
    id: { hex: random.guid() },
    name: random.name(),
    depth: 0,
    expanded: false,
    isLeaf: false,
    selected: false,
    visible: false,
    partiallyVisible: false,
    columnsList: [],
    filterHit: false,
    ...values,
  };
}
