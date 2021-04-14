jest.mock('@vertexvis/stream-api');
jest.mock(
  '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service'
);
jest.mock('../../scenes');
jest.mock('./lib/dom');
jest.mock('../viewer/utils');

import '../../testing/domMocks';

import Chance from 'chance';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { currentDateAsProtoTimestamp } from '@vertexvis/stream-api';
import { sign } from 'jsonwebtoken';
import { Viewer } from '../viewer/viewer';
import { SceneTree } from './scene-tree';
import * as Fixtures from '../../types/__fixtures__';
import { SceneTreeAPIClient } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import {
  createGetTreeResponse,
  mockGrpcUnaryResult,
  ResponseStreamMock,
} from './lib/testing';
import { getSceneTreeViewportHeight } from './lib/dom';
import {
  getAssignedSlotNodes,
  getElementBoundingClientRect,
} from '../viewer/utils';
import { GetTreeResponse } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';

const random = new Chance();

describe('<vertex-scene-tree />', () => {
  const sceneViewId = random.guid();
  const jwt = sign(
    {
      aud: 'vertex-api',
      iss: 'frame-streaming-service-platdev',
      iat: 1618269253,
      sub: '23bccce9-1cb1-4b4f-88b3-5808e6dfed78',
      scene: 'd12e5340-b329-4654-9f7e-68e556637b38',
      view: sceneViewId,
      exp: 1618269553,
    },
    'secret'
  );

  // Viewer mocks
  (getElementBoundingClientRect as jest.Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 150,
    right: 200,
    width: 200,
    height: 150,
  });
  (getAssignedSlotNodes as jest.Mock).mockReturnValue([]);

  // Scene tree mocks
  const client = new SceneTreeAPIClient('http://example.com');
  (client.subscribe as jest.Mock).mockReturnValue(new ResponseStreamMock());
  (getSceneTreeViewportHeight as jest.Mock).mockReturnValue(1000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries for the viewer', async () => {
    mockGetTree(client);
    const { sceneTree, viewer, page } = await loadSceneTree({
      client,
      jwt,
      html: `
        <vertex-scene-tree viewer-selector="#viewer"></vertex-scene-tree>
        <vertex-viewer id="viewer"></vertex-viewer>
      `,
    });

    const rows = page.body
      .querySelector('vertex-scene-tree')
      ?.shadowRoot?.querySelectorAll('.row');

    expect(sceneTree.viewer).toBe(viewer);
    expect(sceneTree.controller).toBeDefined();
    expect(sceneTree.jwt).toBe(jwt);
    expect(rows?.length).toBeGreaterThan(0);
  });

  it('initializes scene tree when setting viewer', async () => {
    mockGetTree(client);

    const { sceneTree, page } = await loadSceneTree({
      client,
      jwt,
      html: `
        <vertex-scene-tree></vertex-scene-tree>
        <vertex-viewer></vertex-viewer>
      `,
      setup({ sceneTree, viewer }) {
        sceneTree.viewer = viewer;
      },
    });

    await page.waitForChanges();
    await sceneTree.controller?.getPage(0)?.res;
    await page.waitForChanges();

    const rows = page.body
      .querySelector('vertex-scene-tree')
      ?.shadowRoot?.querySelectorAll('.row');

    expect(sceneTree.controller).toBeDefined();
    expect(sceneTree.jwt).toBeDefined();
    expect(rows?.length).toBeGreaterThan(0);
  });

  it('invalidates rows when invalidateRows() is called', async () => {
    mockGetTree(client);
    const { sceneTree, page } = await loadSceneTree({
      client,
      jwt,
      html: `
        <vertex-scene-tree viewer-selector="#viewer"></vertex-scene-tree>
        <vertex-viewer id="viewer"></vertex-viewer>
      `,
    });

    const rowData = jest.fn();
    sceneTree.rowData = rowData;
    rowData.mockReset();
    sceneTree.invalidateRows();
    await page.waitForChanges();

    const rows = page.body
      .querySelector('vertex-scene-tree')
      ?.shadowRoot?.querySelectorAll('.row');

    if (rows == null) {
      throw new Error('Rows are empty');
    }

    expect(rowData).toHaveBeenCalledTimes(rows.length);
  });

  it('refetches tree if viewer changes', async () => {
    mockGetTree(client);

    const { sceneTree, page, viewer } = await loadSceneTree({
      client,
      jwt,
      html: `
        <vertex-scene-tree viewer-selector="#viewer"></vertex-scene-tree>
        <vertex-viewer id="viewer"></vertex-viewer>
      `,
    });

    sceneTree.viewer = undefined;
    await page.waitForChanges();

    const res = mockGetTree(client);
    sceneTree.viewer = viewer;
    await page.waitForChanges();
    await sceneTree.controller?.getPage(0)?.res;
    await page.waitForChanges();

    const rows = page.body
      .querySelector('vertex-scene-tree')
      ?.shadowRoot?.querySelectorAll('.row');

    if (rows == null) {
      throw new Error('Rows are empty');
    }

    expect(rows[0].textContent).toContain(res.getItemsList()[0].getName());
  });
});

interface LoadSceneTreeResult {
  sceneTree: SceneTree;
  viewer: HTMLVertexViewerElement;
  page: SpecPage;
}

async function loadSceneTree(data: {
  client: SceneTreeAPIClient;
  jwt: string;
  html: string;
  setup?: (data: LoadSceneTreeResult) => void;
}): Promise<LoadSceneTreeResult> {
  const page = await newSpecPage({
    components: [SceneTree, Viewer],
    html: data.html,
  });

  const sceneTree = page.rootInstance as SceneTree;
  const viewer = page.body.querySelector(
    'vertex-viewer'
  ) as HTMLVertexViewerElement;

  sceneTree.client = data.client;

  const result = { sceneTree, viewer, page };
  data.setup?.(result);

  await loadModelForViewer(viewer, data.jwt, 'stream-key');
  await page.waitForChanges();
  await sceneTree.controller?.getPage(0)?.res;
  await page.waitForChanges();

  return result;
}

async function loadModelForViewer(
  viewer: HTMLVertexViewerElement,
  jwt: string,
  key: string
): Promise<HTMLVertexViewerElement> {
  const startStream = {
    startStream: {
      sceneViewId: { hex: 'scene-view-id' },
      streamId: { hex: 'stream-id' },
      jwt,
    },
  };
  const syncTime = { syncTime: { replyTime: currentDateAsProtoTimestamp() } };
  const api = await viewer.getStream();
  (api.connect as jest.Mock).mockResolvedValue({
    dispose: () => api.dispose(),
  });
  (api.startStream as jest.Mock).mockResolvedValue(startStream);
  (api.syncTime as jest.Mock).mockResolvedValue(syncTime);

  const loading = viewer.load(`urn:vertexvis:stream-key:${key}`);

  // Emit frame drawn on next event loop
  setTimeout(() => viewer.dispatchFrameDrawn(Fixtures.frame), 0);
  await loading;
  return viewer;
}

function mockGetTree(
  client: SceneTreeAPIClient,
  itemCount = 100,
  totalCount = 100
): GetTreeResponse {
  const res = createGetTreeResponse(itemCount, totalCount);
  (client.getTree as jest.Mock).mockImplementation(mockGrpcUnaryResult(res));
  return res;
}
