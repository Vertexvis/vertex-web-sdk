jest.mock('./utils');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { Async } from '@vertexvis/utils';
import Chance from 'chance';

import { SceneTreeCellHoverController } from '../scene-tree-table-layout/lib/hover-controller';
import { SceneTreeTableCell } from './scene-tree-table-cell';
import { blurElement } from './utils';

const random = new Chance();

describe('<vertex-scene-tree-table-cell>', () => {
  const pointerDownEvent = new MouseEvent('pointerdown', {
    button: 0,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('renders a column spacer if no right-gutter button is enabled', async () => {
    const node = createNode();
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell.shadowRoot?.querySelector('.column-spacer')).toBeTruthy();
  });

  it('does not render a column spacer if the visibility toggle is enabled', async () => {
    const node = createNode();
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell visibility-toggle></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell.shadowRoot?.querySelector('.column-spacer')).toBeFalsy();
  });

  it('does not render a column spacer if the isolate button is enabled', async () => {
    const node = createNode();
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell isolate-button></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(cell.shadowRoot?.querySelector('.column-spacer')).toBeFalsy();
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

  it('does not render expand or collapse icon if item is an end item', async () => {
    const node = createNode({ endItem: true });
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

  it('renders isolate icon if isolate button is true', async () => {
    const node = createNode();
    const { cell } = await newComponentSpec({
      html: `<vertex-scene-tree-table-cell isolate-button></vertex-scene-tree-table-cell>`,
      node,
    });

    expect(
      cell.shadowRoot?.querySelector('vertex-icon.icon-locate')
    ).toBeDefined();
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

    const expandBtn = cell.shadowRoot?.querySelector('.expand-btn');
    const originalEvent = new MouseEvent('pointerup');
    expandBtn?.dispatchEvent(originalEvent);

    expect(tree.toggleExpandItem).toHaveBeenCalled();
  });

  it('supports overriding expansion behavior', async () => {
    const node = createNode({ expanded: false });
    const { cell } = await newComponentSpec({
      template: () => (
        <vertex-scene-tree-table-cell
          expansionHandler={(event, node, tree) => {
            // do nothing
          }}
          expand-toggle
        ></vertex-scene-tree-table-cell>
      ),

      node,
    });

    const tree = { toggleExpandItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const expandBtn = cell.shadowRoot?.querySelector('.expand-btn');
    expandBtn?.dispatchEvent(new MouseEvent('pointerup'));

    expect(tree.toggleExpandItem).not.toHaveBeenCalled();
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

    const expandBtn = cell.shadowRoot?.querySelector('.visibility-btn');
    const originalEvent = new MouseEvent('pointerup');
    expandBtn?.dispatchEvent(originalEvent);

    expect(tree.toggleItemVisibility).toHaveBeenCalled();
  });

  it('supports overriding visibility behavior', async () => {
    const node = createNode({ visible: false });
    const { cell } = await newComponentSpec({
      template: () => (
        <vertex-scene-tree-table-cell
          visibilityHandler={(event, node, tree) => {
            // do nothing
          }}
          visibility-toggle
        ></vertex-scene-tree-table-cell>
      ),
      node,
    });

    const tree = { toggleItemVisibility: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const expandBtn = cell.shadowRoot?.querySelector('.visibility-btn');
    expandBtn?.dispatchEvent(new MouseEvent('pointerup'));

    expect(tree.toggleItemVisibility).not.toHaveBeenCalled();
  });

  it('isolates', async () => {
    const node = createNode({ visible: false });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell isolate-button></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const tree = { isolateItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const isolateBtn = cell.shadowRoot?.querySelector('.isolate-btn');
    const originalEvent = new MouseEvent('pointerup');
    isolateBtn?.dispatchEvent(originalEvent);

    expect(tree.isolateItem).toHaveBeenCalled();
  });

  it('supports overriding isolate behavior', async () => {
    const node = createNode({ visible: false });
    const { cell } = await newComponentSpec({
      template: () => (
        <vertex-scene-tree-table-cell
          isolateHandler={(event, node, tree) => {
            // do nothing
          }}
          isolate-button
        ></vertex-scene-tree-table-cell>
      ),
      node,
    });

    const tree = { isolateItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    const isolateBtn = cell.shadowRoot?.querySelector('.isolate-btn');
    isolateBtn?.dispatchEvent(new MouseEvent('pointerup'));

    expect(tree.isolateItem).not.toHaveBeenCalled();
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

    const originalEvent = new MouseEvent('pointerup', { button: 0 });
    cell.dispatchEvent(pointerDownEvent);
    cell.dispatchEvent(originalEvent);

    expect(tree.selectItem).toHaveBeenCalled();
  });

  it('does not select cell on long press', async () => {
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

    const originalEvent = new MouseEvent('pointerup', { button: 0 });
    cell.dispatchEvent(pointerDownEvent);
    await Async.delay(550); // mock a long press on mobile
    cell.dispatchEvent(originalEvent);

    expect(tree.selectItem).not.toHaveBeenCalled();
  });

  it('supports custom selection handling', async () => {
    const node = createNode({ selected: false });
    const tree = { selectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const { cell } = await newComponentSpec({
      template: () => (
        <vertex-scene-tree-table-cell
          selectionHandler={(event, node, tree) => {
            if (!event.altKey) {
              tree.selectItem(node);
            }
          }}
        ></vertex-scene-tree-table-cell>
      ),
      node,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cell as any).tree = tree;

    cell.dispatchEvent(pointerDownEvent);
    const originalEvent = new MouseEvent('pointerup', {
      button: 0,
      altKey: true,
    });
    cell.dispatchEvent(originalEvent);

    expect(tree.selectItem).not.toHaveBeenCalled();
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

    cell.dispatchEvent(pointerDownEvent);
    const originalEvent = new MouseEvent('pointerup', {
      button: 0,
      metaKey: true,
      clientY: 0,
    });
    cell.dispatchEvent(originalEvent);

    expect(tree.selectItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ append: true })
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

    cell.dispatchEvent(pointerDownEvent);
    cell.dispatchEvent(
      new MouseEvent('pointerup', { button: 0, ctrlKey: true })
    );

    expect(tree.selectItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ append: true })
    );
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

    cell.dispatchEvent(pointerDownEvent);
    cell.dispatchEvent(new MouseEvent('pointerup', { button: 0 }));

    expect(tree.selectItem).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ recurseParent: true })
    );
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

    cell.dispatchEvent(pointerDownEvent);

    cell.dispatchEvent(
      new MouseEvent('pointerup', { button: 0, metaKey: true })
    );

    expect(tree.deselectItem).toHaveBeenCalled();
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

    const originalEvent = new MouseEvent('pointerup', {
      button: 0,
      ctrlKey: true,
    });
    cell.dispatchEvent(pointerDownEvent);
    cell.dispatchEvent(originalEvent);

    expect(tree.deselectItem).toHaveBeenCalled();
  });

  it('does not select if event default behavior prevented', async () => {
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

    const event = new MouseEvent('pointerup', { button: 0, metaKey: true });
    event.preventDefault();
    cell.dispatchEvent(event);

    expect(tree.selectItem).not.toHaveBeenCalled();
  });

  it('updates the hover controller when a pointer enters the cell', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const hoverController = new SceneTreeCellHoverController();
    const hovered = jest.fn();
    const disposable = hoverController.stateChanged(hovered);
    cell.hoverController = hoverController;

    cell.dispatchEvent(new MouseEvent('pointerenter'));

    disposable.dispose();

    expect(hovered).toHaveBeenCalledWith(node.id?.hex);
  });

  it('updates the hover controller when a pointer leaves the cell', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const hoverController = new SceneTreeCellHoverController();
    const hovered = jest.fn();
    const disposable = hoverController.stateChanged(hovered);
    cell.hoverController = hoverController;

    cell.dispatchEvent(new MouseEvent('pointerleave'));

    disposable.dispose();

    expect(hovered).toHaveBeenCalledWith(undefined);
  });

  it('blurs the element when an action button is clicked', async () => {
    const node = createNode({ selected: true });
    const { cell } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-cell expand-toggle isolate-button visibility-toggle></vertex-scene-tree-table-cell>
      `,
      node,
    });

    const expand = cell.shadowRoot?.querySelector('.expand-btn');
    const visibility = cell.shadowRoot?.querySelector('.visibility-btn');
    const isolate = cell.shadowRoot?.querySelector('.isolate-btn');

    console.log(expand);

    expand?.dispatchEvent(new MouseEvent('pointerup'));
    expect(blurElement).toHaveBeenCalledTimes(1);

    visibility?.dispatchEvent(new MouseEvent('pointerup'));
    expect(blurElement).toHaveBeenCalledTimes(2);

    isolate?.dispatchEvent(new MouseEvent('pointerup'));
    expect(blurElement).toHaveBeenCalledTimes(3);
  });
});

async function newComponentSpec(data: {
  html?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template?: () => any;
  node?: Node.AsObject;
}): Promise<{ page: SpecPage; cell: HTMLVertexSceneTreeTableCellElement }> {
  const page = await newSpecPage({
    components: [SceneTreeTableCell],
    template: data.template,
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
    phantom: false,
    endItem: false,
    ...values,
  };
}
