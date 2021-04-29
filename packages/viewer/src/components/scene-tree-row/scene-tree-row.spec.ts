import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import Chance from 'chance';
import { SceneTreeRow } from './scene-tree-row';

const random = new Chance();

describe('<vertex-scene-tree-row>', () => {
  it('renders empty element if node is undefined', async () => {
    const { row } = await newComponentSpec({
      html: `<vertex-scene-tree-row></vertex-scene-tree-row>`,
    });

    expect(row.shadowRoot?.querySelector('.root')).toBeFalsy();
  });

  it('renders row with name of row', async () => {
    const node = createNode();
    const { row } = await newComponentSpec({
      html: `<vertex-scene-tree-row></vertex-scene-tree-row>`,
      node,
    });

    const label = row.shadowRoot?.querySelector('.label');
    expect(label?.textContent).toBe(node.name);
  });

  it('renders expand icon if expanded', async () => {
    const node = createNode({ expanded: true, isLeaf: false });
    const { row } = await newComponentSpec({
      html: `<vertex-scene-tree-row></vertex-scene-tree-row>`,
      node,
    });

    expect(row.shadowRoot?.querySelector('.icon-expanded')).toBeDefined();
  });

  it('renders collapse icon if collapsed', async () => {
    const node = createNode({ expanded: false, isLeaf: false });
    const { row } = await newComponentSpec({
      html: `<vertex-scene-tree-row></vertex-scene-tree-row>`,
      node,
    });

    expect(row.shadowRoot?.querySelector('.icon-collapsed')).toBeDefined();
  });

  it('does not render expand or collapse icon if leaf', async () => {
    const node = createNode({ isLeaf: true });
    const { row } = await newComponentSpec({
      html: `<vertex-scene-tree-row></vertex-scene-tree-row>`,
      node,
    });

    expect(row.shadowRoot?.querySelector('.icon-collapsed')).toBeFalsy();
    expect(row.shadowRoot?.querySelector('.icon-expanded')).toBeFalsy();
  });

  it('renders visible icon if visible', async () => {
    const node = createNode({ visible: true });
    const { row } = await newComponentSpec({
      html: `<vertex-scene-tree-row></vertex-scene-tree-row>`,
      node,
    });

    expect(row.shadowRoot?.querySelector('.icon-visible')).toBeDefined();
  });

  it('renders hidden icon if hidden', async () => {
    const node = createNode({ visible: false });
    const { row } = await newComponentSpec({
      html: `<vertex-scene-tree-row></vertex-scene-tree-row>`,
      node,
    });

    expect(row.shadowRoot?.querySelector('.icon-hidden')).toBeDefined();
  });

  it('sets indentation based on depth', async () => {
    const node = createNode({ depth: 2 });
    const { row } = await newComponentSpec({
      html: `<vertex-scene-tree-row></vertex-scene-tree-row>`,
      node,
    });

    const rootEl = row.shadowRoot?.querySelector('.root') as HTMLElement;

    expect(rootEl?.style.getPropertyValue('--depth')).toBe('2');
  });

  it('toggles expansion', async () => {
    const node = createNode({ expanded: false });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { toggleExpandItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const expandToggled = jest.fn();
    row.addEventListener('expandToggled', expandToggled);

    const expandBtn = row.shadowRoot?.querySelector('.expand-btn');
    expandBtn?.dispatchEvent(new MouseEvent('mousedown'));

    expect(tree.toggleExpandItem).toHaveBeenCalled();
    expect(expandToggled).toHaveBeenCalled();
  });

  it('does not expands row if interaction disabled', async () => {
    const node = createNode({ expanded: false });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row interactions-disabled></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { toggleExpandItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const expandToggled = jest.fn();
    row.addEventListener('expandToggled', expandToggled);

    const expandBtn = row.shadowRoot?.querySelector('.expand-btn');
    expandBtn?.dispatchEvent(new MouseEvent('mousedown'));

    expect(tree.toggleExpandItem).not.toHaveBeenCalled();
    expect(expandToggled).toHaveBeenCalled();
  });

  it('toggles visibility', async () => {
    const node = createNode({ visible: false });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { toggleItemVisibility: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const visibilityToggled = jest.fn();
    row.addEventListener('visibilityToggled', visibilityToggled);

    const expandBtn = row.shadowRoot?.querySelector('.visibility-btn');
    expandBtn?.dispatchEvent(new MouseEvent('mousedown'));

    expect(tree.toggleItemVisibility).toHaveBeenCalled();
    expect(visibilityToggled).toHaveBeenCalled();
  });

  it('does not toggle visibility row if interaction disabled', async () => {
    const node = createNode({ visible: false });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row interactions-disabled></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { toggleItemVisibility: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const visibilityToggled = jest.fn();
    row.addEventListener('visibilityToggled', visibilityToggled);

    const expandBtn = row.shadowRoot?.querySelector('.visibility-btn');
    expandBtn?.dispatchEvent(new MouseEvent('mousedown'));

    expect(tree.toggleItemVisibility).not.toHaveBeenCalled();
    expect(visibilityToggled).toHaveBeenCalled();
  });

  it('selects row if unselected', async () => {
    const node = createNode({ selected: false });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { selectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const selected = jest.fn();
    row.addEventListener('selectionToggled', selected);

    row.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

    expect(tree.selectItem).toHaveBeenCalled();
    expect(selected).toHaveBeenCalled();
  });

  it('appends selection if unselected and meta key', async () => {
    const node = createNode({ selected: false });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { selectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const selected = jest.fn();
    row.addEventListener('selectionToggled', selected);

    row.dispatchEvent(
      new MouseEvent('mousedown', { button: 0, metaKey: true })
    );

    expect(tree.selectItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ append: true })
    );
    expect(selected).toHaveBeenCalled();
  });

  it('appends selection if unselected and ctrl key', async () => {
    const node = createNode({ selected: false });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { selectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const selected = jest.fn();
    row.addEventListener('selectionToggled', selected);

    row.dispatchEvent(
      new MouseEvent('mousedown', { button: 0, ctrlKey: true })
    );

    expect(tree.selectItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ append: true })
    );
    expect(selected).toHaveBeenCalled();
  });

  it('deselects if selected and meta key', async () => {
    const node = createNode({ selected: true });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { deselectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const selected = jest.fn();
    row.addEventListener('selectionToggled', selected);

    row.dispatchEvent(
      new MouseEvent('mousedown', { button: 0, metaKey: true })
    );

    expect(tree.deselectItem).toHaveBeenCalled();
    expect(selected).toHaveBeenCalled();
  });

  it('deselects if selected and ctrl key', async () => {
    const node = createNode({ selected: true });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row></vertex-scene-tree-row>
      `,
      node,
    });

    const tree = { deselectItem: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = tree;

    const selected = jest.fn();
    row.addEventListener('selectionToggled', selected);

    row.dispatchEvent(
      new MouseEvent('mousedown', { button: 0, ctrlKey: true })
    );

    expect(tree.deselectItem).toHaveBeenCalled();
    expect(selected).toHaveBeenCalled();
  });

  it('does not select if event default behavior prevented', async () => {
    const node = createNode({ selected: false });
    const { row } = await newComponentSpec({
      html: `
        <vertex-scene-tree-row></vertex-scene-tree-row>
      `,
      node,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row as any).tree = {};

    const selected = jest.fn();
    row.addEventListener('selected', selected);

    const event = new MouseEvent('mousedown', { button: 0, metaKey: true });
    event.preventDefault();
    row.dispatchEvent(event);

    expect(selected).not.toHaveBeenCalled();
  });
});

async function newComponentSpec(data: {
  html: string;
  node?: Node.AsObject;
}): Promise<{ page: SpecPage; row: HTMLVertexSceneTreeRowElement }> {
  const page = await newSpecPage({
    components: [SceneTreeRow],
    html: data.html,
  });
  const row = page.root as HTMLVertexSceneTreeRowElement;

  if (data.node != null) {
    row.node = data.node;
    await page.waitForChanges();
  }

  return { page, row };
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
    ...values,
  };
}
