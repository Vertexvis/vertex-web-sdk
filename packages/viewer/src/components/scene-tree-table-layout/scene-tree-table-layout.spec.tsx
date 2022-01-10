jest.mock('@vertexvis/stream-api');
jest.mock(
  '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service'
);
jest.mock('./lib/dom');
jest.mock('../../lib/stencil', () => ({
  readDOM: jest.fn((fn) => fn()),
}));
jest.mock('../scene-tree/lib/dom');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { GetTreeResponse } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import { SceneTreeAPIClient } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';

import { readDOM } from '../../lib/stencil';
import {
  createGetTreeResponse,
  mockGrpcUnaryResult,
  random,
  ResponseStreamMock,
} from '../../testing';
import { triggerResizeObserver } from '../../testing/resizeObserver';
import { SceneTreeController } from '../scene-tree/lib/controller';
import { getSceneTreeViewportHeight } from '../scene-tree/lib/dom';
import { SceneTreeTableCell } from '../scene-tree-table-cell/scene-tree-table-cell';
import { SceneTreeTableColumn } from '../scene-tree-table-column/scene-tree-table-column';
import { SceneTreeTableHeader } from '../scene-tree-table-header/scene-tree-table-header';
import {
  getSceneTreeTableOffsetTop,
  getSceneTreeTableViewportWidth,
} from './lib/dom';
import { SceneTreeTableLayout } from './scene-tree-table-layout';

describe('<vertex-scene-tree-table-layout>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSceneTreeViewportHeight as jest.Mock).mockReturnValue(1000);
    (getSceneTreeTableOffsetTop as jest.Mock).mockReturnValue(0);
    (getSceneTreeTableViewportWidth as jest.Mock).mockReturnValue(0);
  });

  it('updates the layout position on resize', async () => {
    const { page, table } = await newSceneTreeTableSpec();

    expect(table.layoutOffset).toBe(0);
    (getSceneTreeTableOffsetTop as jest.Mock).mockReturnValue(1000);

    triggerResizeObserver();
    await page.waitForChanges();

    expect(readDOM).toHaveBeenCalled();
    expect(table.layoutOffset).toBe(1000);
  });

  it('creates cells from column template', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const { page, table } = await newSceneTreeTableSpec({
      controller,
      html: `
          <vertex-scene-tree-table-layout>
            <vertex-scene-tree-table-column>
              <template>
                <div class="templated-div" />
              </template>
            </vertex-scene-tree-table-column>
          </vertex-scene-tree-table-layout>
      `,
    });

    const mockRow = {
      index: 0,
      node: createNode(),
      metadata: {},
      data: {},
    };
    table.rows = [mockRow];
    table.totalRows = table.rows.length;

    await page.waitForChanges();

    expect(
      table
        .querySelector('vertex-scene-tree-table-column')
        ?.querySelector('div.templated-div')
    ).not.toBeNull();
  });

  it('responds to hover events', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const { page, table } = await newSceneTreeTableSpec({
      controller,
      html: `
          <vertex-scene-tree-table-layout>
            <vertex-scene-tree-table-column>
              <template>
                <vertex-scene-tree-table-cell>
                </vertex-scene-tree-table-cell>
              </template>
            </vertex-scene-tree-table-column>
          </vertex-scene-tree-table-layout> 
      `,
    });

    const mockRow = {
      index: 0,
      node: createNode(),
      metadata: {},
      data: {},
    };
    table.rows = [mockRow];
    table.totalRows = table.rows.length;

    await page.waitForChanges();

    const cell = table.querySelector('vertex-scene-tree-table-cell');

    cell?.dispatchEvent(new MouseEvent('pointerenter'));

    await page.waitForChanges();

    expect(
      table.querySelector('vertex-scene-tree-table-cell')?.hoveredNodeId
    ).toBe(mockRow.node.id?.hex);
  });

  it('throws an exception if no cell template is specified for a column', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    await expect(
      newSceneTreeTableSpec({
        controller,
        html: `
          <vertex-scene-tree-table-layout>
            <vertex-scene-tree-table-column>
            </vertex-scene-tree-table-column>
          </vertex-scene-tree-table-layout>
      `,
      })
    ).rejects.toThrow(new Error('Column is missing cell template element'));
  });

  it('creates headers from header template', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const { table } = await newSceneTreeTableSpec({
      controller,
      html: `
        <vertex-scene-tree-table-layout>
        <vertex-scene-tree-table-column>
          <template slot="header">
            <div class="templated-header-div" />
          </template>
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
      </vertex-scene-tree-table-layout>
      `,
    });

    expect(table.querySelector('div.templated-header-div')).not.toBeNull();
  });

  it('creates dividers from the divider template', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const { table } = await newSceneTreeTableSpec({
      controller,
      html: `
        <vertex-scene-tree-table-layout>
          <template slot="divider">
            <div class="templated-divider-div" />
          </template>

          <vertex-scene-tree-table-column>
            <template slot="header">
              <div class="templated-header-div" />
            </template>
            <template>
              <div class="templated-div" />
            </template>
          </vertex-scene-tree-table-column>

          <vertex-scene-tree-table-column>
            <template slot="header">
              <div class="templated-header-div" />
            </template>
            <template>
              <div class="templated-div" />
            </template>
          </vertex-scene-tree-table-column>
        </vertex-scene-tree-table-layout>
      `,
    });

    expect(table.querySelector('div.templated-divider-div')).not.toBeNull();
  });

  it('does not render dividers for a single column', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const { table } = await newSceneTreeTableSpec({
      controller,
      html: `
        <vertex-scene-tree-table-layout>
          <template slot="divider">
            <div class="templated-divider-div" />
          </template>

          <vertex-scene-tree-table-column>
            <template slot="header">
              <div class="templated-header-div" />
            </template>
            <template>
              <div class="templated-div" />
            </template>
          </vertex-scene-tree-table-column>
        </vertex-scene-tree-table-layout>
      `,
    });

    expect(table.querySelector('div.templated-divider-div')).toBeNull();
  });

  it('supports column resizing', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const { page, table } = await newSceneTreeTableSpec({
      controller,
      html: `
        <vertex-scene-tree-table-layout>
        <template slot="divider">
          <div class="templated-divider-div" />
        </template>

        <vertex-scene-tree-table-column initial-width="100">
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
        <vertex-scene-tree-table-column initial-width="100">
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
      </vertex-scene-tree-table-layout>
      `,
    });

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style')
    ).toContain('grid-template-columns:  100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style')
    ).toContain('grid-template-columns:  110px 1fr');
  });

  it('constrains column resizing minimums', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const { page, table } = await newSceneTreeTableSpec({
      controller,
      html: `
        <vertex-scene-tree-table-layout>
        <template slot="divider">
          <div class="templated-divider-div" />
        </template>

        <vertex-scene-tree-table-column initial-width="100" min-width="100">
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
        <vertex-scene-tree-table-column initial-width="100" min-width="100">
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
      </vertex-scene-tree-table-layout>
      `,
    });

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style')
    ).toContain('grid-template-columns:  100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 0 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style')
    ).toContain('grid-template-columns:  100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 20 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style')
    ).toContain('grid-template-columns:  100px 1fr');
  });

  it('constrains column resizing minimums', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const { page, table } = await newSceneTreeTableSpec({
      controller,
      html: `
        <vertex-scene-tree-table-layout>
        <template slot="divider">
          <div class="templated-divider-div" />
        </template>

        <vertex-scene-tree-table-column initial-width="100" max-width="100">
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
        <vertex-scene-tree-table-column initial-width="100" max-width="100">
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
      </vertex-scene-tree-table-layout>
      `,
    });

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style')
    ).toContain('grid-template-columns:  100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 0 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style')
    ).toContain('grid-template-columns:  100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 20 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style')
    ).toContain('grid-template-columns:  100px 1fr');
  });
});

async function newSceneTreeTableSpec(data?: {
  controller?: SceneTreeController;
  template?: () => unknown;
  html?: string;
}): Promise<{
  table: HTMLVertexSceneTreeTableLayoutElement;
  page: SpecPage;
  waitForControllerConnected: () => Promise<void>;
}> {
  const page = await newSpecPage({
    components: [
      SceneTreeTableLayout,
      SceneTreeTableColumn,
      SceneTreeTableCell,
      SceneTreeTableHeader,
    ],
    template:
      data?.html == null
        ? () => {
            return (
              data?.template?.() || (
                <vertex-scene-tree-table-layout controller={data?.controller} />
              )
            );
          }
        : undefined,
    html: data?.html,
  });

  const table = page.body.querySelector(
    'vertex-scene-tree-table-layout'
  ) as HTMLVertexSceneTreeTableLayoutElement;

  return {
    table,
    page,
    waitForControllerConnected: async () => {
      await new Promise<void>((resolve) => {
        if (data?.controller != null) {
          data.controller.onStateChange.on((state) => {
            if (state.connection.type === 'connected') {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
      await page.waitForChanges();
    },
  };
}

interface MockGetTreeOptions {
  client: SceneTreeAPIClient;
  itemCount?: number;
  totalCount?: number;
  transform?: (node: Node) => void;
}

function mockSceneTreeClient(): SceneTreeAPIClient {
  const client = new SceneTreeAPIClient('https://example.com');
  (client.subscribe as jest.Mock).mockReturnValue(new ResponseStreamMock());
  return client;
}

function mockGetTree({
  client,
  itemCount = 100,
  totalCount = 100,
  transform,
}: MockGetTreeOptions): GetTreeResponse {
  const res = createGetTreeResponse(itemCount, totalCount, transform);
  (client.getTree as jest.Mock).mockImplementation(mockGrpcUnaryResult(res));
  return res;
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
    ...values,
  };
}
