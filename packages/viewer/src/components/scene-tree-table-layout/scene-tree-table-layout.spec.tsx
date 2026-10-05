import type { Mock } from '#test/mock-types';
vi.mock('@vertexvis/stream-api');
vi.mock(
  '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service',
);
vi.mock('./lib/dom');
vi.mock('./lib/window');
vi.mock('../../lib/stencil', () => ({
  readDOM: vi.fn((fn) => fn()),
}));
vi.mock('../scene-tree/lib/dom');

import '../scene-tree-table-cell/scene-tree-table-cell';
import '../scene-tree-table-column/scene-tree-table-column';
import '../scene-tree-table-header/scene-tree-table-header';
import '../scene-tree-table-resize-divider/scene-tree-table-resize-divider';
import './scene-tree-table-layout';

import { render } from '@stencil/vitest';
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
import { Row } from '../scene-tree/lib/row';
import {
  getSceneTreeTableOffsetTop,
  getSceneTreeTableViewportWidth,
} from './lib/dom';
import { SceneTreeCellHoverController } from './lib/hover-controller';
import { restartTimeout } from './lib/window';

describe('<vertex-scene-tree-table-layout>', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSceneTreeViewportHeight as Mock).mockReturnValue(1000);
    (getSceneTreeTableOffsetTop as Mock).mockReturnValue(0);
    (getSceneTreeTableViewportWidth as Mock).mockReturnValue(200);

    // Happy DOM cannot measure the templated cell used to determine row height.
    const getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        return this.tagName === 'VERTEX-SCENE-TREE-TABLE-CELL'
          ? new DOMRect(0, 0, 0, 24)
          : getBoundingClientRect.call(this);
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates the layout position on resize', async () => {
    const page = await render('<vertex-scene-tree-table-layout />', {
      waitForReady: false,
    });
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    await page.waitForChanges();

    expect(table.layoutOffset).toBe(0);
    (getSceneTreeTableOffsetTop as Mock).mockReturnValue(1000);

    triggerResizeObserver();
    await page.waitForChanges();

    expect(readDOM).toHaveBeenCalled();
    expect(table.layoutOffset).toBe(1000);
  });

  it('creates cells from column template', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
          <vertex-scene-tree-table-layout>
            <vertex-scene-tree-table-column>
              <template>
                <div class="templated-div" />
              </template>
            </vertex-scene-tree-table-column>
          </vertex-scene-tree-table-layout>
      `,
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

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
        ?.querySelector('div.templated-div'),
    ).not.toBeNull();
  });

  it('provides scene tree cells with the created hover controller', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
          <vertex-scene-tree-table-layout>
            <vertex-scene-tree-table-column>
              <template>
                <vertex-scene-tree-table-cell>
                </vertex-scene-tree-table-cell>
              </template>
            </vertex-scene-tree-table-column>
          </vertex-scene-tree-table-layout>
      `,
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    const mockRow = {
      index: 0,
      node: createNode(),
      metadata: {},
      data: {},
    };
    table.rows = [mockRow];
    table.totalRows = table.rows.length;

    await page.waitForChanges();

    await vi.waitFor(async () => {
      await page.waitForChanges();
      expect(
        table.querySelector('vertex-scene-tree-table-cell')?.node?.id?.hex,
      ).toBe(mockRow.node.id?.hex);
    });

    const hovered = vi.fn();
    const hoverController = new SceneTreeCellHoverController();
    const disposable = hoverController.stateChanged(hovered);
    const cell = table.querySelector(
      'vertex-scene-tree-table-cell',
    ) as HTMLVertexSceneTreeTableCellElement;
    cell.hoverController = hoverController;

    cell?.dispatchEvent(new MouseEvent('pointerenter'));

    await page.waitForChanges();

    disposable.dispose();

    expect(hovered).toHaveBeenCalledWith(mockRow.node.id?.hex);
  });

  it('creates headers from header template', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
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
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    expect(table.querySelector('div.templated-header-div')).not.toBeNull();
  });

  it('creates dividers from the divider template', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
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
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    expect(table.querySelector('div.templated-divider-div')).not.toBeNull();
  });

  it('does not render dividers for a single column', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
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
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    expect(table.querySelector('div.templated-divider-div')).toBeNull();
  });

  it('supports column resizing', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
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
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 110px 1fr');
  });

  it('constrains column resizing minimums', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
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
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 0 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 20 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 100px 1fr');
  });

  it('constrains column resizing minimums', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
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
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 0 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 100px 1fr');

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 20 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 100px 1fr');
  });

  it('emits events on column resize', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
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
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    let resizeDetail: number[] = [];
    const resizeListener = vi.fn((event) => {
      resizeDetail = event.detail;
    });

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 100px 1fr');

    table.addEventListener('columnsResized', resizeListener);

    table
      .querySelector('div.templated-divider-div')
      ?.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0 }));

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 10 }));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 110px 1fr');
    expect(resizeDetail).toHaveLength(2);
    expect(resizeDetail[0]).toBeCloseTo(110);
    expect(resizeDetail[1]).toBeCloseTo(90);
  });

  it('initializes with widths adjusted down', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
        <vertex-scene-tree-table-layout>
        <template slot="divider">
          <div class="templated-divider-div" />
        </template>

        <vertex-scene-tree-table-column initial-width="300">
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
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 150px 1fr');
  });

  it('initializes with widths adjusted up', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
        <vertex-scene-tree-table-layout>
        <template slot="divider">
          <div class="templated-divider-div" />
        </template>

        <vertex-scene-tree-table-column initial-width="75">
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
        <vertex-scene-tree-table-column initial-width="25">
          <template>
            <div class="templated-div" />
          </template>
        </vertex-scene-tree-table-column>
      </vertex-scene-tree-table-layout>
      `,
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    expect(
      table.shadowRoot?.querySelector('div.table')?.getAttribute('style'),
    ).toContain('grid-template-columns: 150px 1fr');
  });

  it('debounces isScrolling updates for the cells', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
        <vertex-scene-tree-table-layout>
        <template slot="divider">
          <div class="templated-divider-div" />
        </template>

        <vertex-scene-tree-table-column initial-width="100" max-width="100">
          <template>
            <vertex-scene-tree-table-cell class="templated-cell" />
          </template>
        </vertex-scene-tree-table-column>
        <vertex-scene-tree-table-column initial-width="100" max-width="100">
          <template>
            <vertex-scene-tree-table-cell class="templated-cell" />
          </template>
        </vertex-scene-tree-table-column>
      </vertex-scene-tree-table-layout>
      `,
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    let restartTimeoutFn: VoidFunction | undefined;
    (restartTimeout as Mock).mockImplementation((fn: VoidFunction) => {
      restartTimeoutFn = fn;

      return 1;
    });

    const createMockRow = (index: number): Row => ({
      index,
      node: createNode(),
      metadata: {},
      data: {},
    });
    table.rows = new Array(100).fill(undefined).map((_, i) => createMockRow(i));
    table.totalRows = table.rows.length;

    await page.waitForChanges();

    await vi.waitFor(async () => {
      await page.waitForChanges();
      expect(
        table.querySelector('vertex-scene-tree-table-cell')?.node?.id?.hex,
      ).toBe(table.rows[0]?.node?.id?.hex);
    });

    const tableContainer = table.shadowRoot?.querySelector(
      'div.table',
    ) as HTMLDivElement;

    tableContainer.scrollTop = 5;
    tableContainer.dispatchEvent(new Event('scroll'));

    await page.waitForChanges();

    expect(restartTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
    );

    expect(
      table.querySelector('vertex-scene-tree-table-cell')?.isScrolling,
    ).toBe(true);

    tableContainer.scrollTop = 10;
    tableContainer.dispatchEvent(new Event('scroll'));

    await page.waitForChanges();

    expect(restartTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Number),
    );

    expect(
      table.querySelector('vertex-scene-tree-table-cell')?.isScrolling,
    ).toBe(true);

    restartTimeoutFn?.();

    await page.waitForChanges();

    expect(
      tableContainer.querySelector('vertex-scene-tree-table-cell')?.isScrolling,
    ).toBeFalsy();
  });

  it('does not compute NaN values for active row indices', async () => {
    const client = mockSceneTreeClient();
    mockGetTree({ client });

    (getSceneTreeViewportHeight as Mock).mockReturnValue(0);

    const controller = new SceneTreeController(client, 100);
    const page = await render(
      `
        <vertex-scene-tree-table-layout row-height="0">
          <vertex-scene-tree-table-column initial-width="100" max-width="100">
            <template>
              <div style="height: 0;"></div>
            </template>
          </vertex-scene-tree-table-column>
        </vertex-scene-tree-table-layout>
      `,
      { waitForReady: false },
    );
    const table = page.root as HTMLVertexSceneTreeTableLayoutElement;
    table.controller = controller;
    await page.waitForChanges();

    const mockRow = {
      index: 0,
      node: createNode(),
      metadata: {},
      data: {},
    };
    controller.updateState({
      totalRows: 0,
      isSearching: false,
      rows: [mockRow],
      connection: {
        type: 'connected',
        jwtProvider: () => 'jwt',
        sceneViewId: 'scene-view-id',
        subscription: { dispose: vi.fn() },
      },
    });
    table.rows = [mockRow];
    table.totalRows = table.rows.length;

    await page.waitForChanges();

    const activeRowRange = controller.getActiveRowRange();
    expect(activeRowRange[0]).not.toBeNaN();
    expect(activeRowRange[1]).not.toBeNaN();
  });
});

interface MockGetTreeOptions {
  client: SceneTreeAPIClient;
  itemCount?: number;
  totalCount?: number;
  transform?: (node: Node) => void;
}

function mockSceneTreeClient(): SceneTreeAPIClient {
  const client = new SceneTreeAPIClient('https://example.com');
  (client.subscribe as Mock).mockReturnValue(new ResponseStreamMock());
  return client;
}

function mockGetTree({
  client,
  itemCount = 100,
  totalCount = 100,
  transform,
}: MockGetTreeOptions): GetTreeResponse {
  const res = createGetTreeResponse(itemCount, totalCount, transform);
  (client.getTree as Mock).mockImplementation(mockGrpcUnaryResult(res));
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
    filterHit: false,
    phantom: false,
    endItem: false,
    hasGeometry: false,
    ...values,
  };
}
