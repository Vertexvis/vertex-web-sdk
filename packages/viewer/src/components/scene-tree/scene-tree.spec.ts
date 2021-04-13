jest.mock('@vertexvis/stream-api');
jest.mock(
  '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service'
);
jest.mock('../../scenes');

import '../../testing/domMocks';

import Chance from 'chance';
import { newSpecPage } from '@stencil/core/testing';
import { currentDateAsProtoTimestamp } from '@vertexvis/stream-api';
import { sign } from 'jsonwebtoken';
import { Viewer } from '../viewer/viewer';
import { SceneTree } from './scene-tree';
import * as Fixtures from '../../types/__fixtures__';
import { SceneTreeAPIClient } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { ResponseStreamMock } from './lib/testing';

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

  const client = new SceneTreeAPIClient('http://example.com');
  (client.subscribe as jest.Mock).mockReturnValue(new ResponseStreamMock());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries for the viewer', async () => {
    const page = await newSpecPage({
      components: [SceneTree, Viewer],
      html: `
        <vertex-scene-tree viewer-selector="#viewer"></vertex-scene-tree>
        <vertex-viewer id="viewer"></vertex-viewer>
      `,
    });

    const sceneTree = page.body.querySelector(
      'vertex-scene-tree'
    ) as HTMLVertexSceneTreeElement;

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;

    sceneTree.client = client;
    await loadModelForViewer(viewer, jwt, 'stream-key');

    await page.waitForChanges();

    expect(sceneTree.viewer).toBe(viewer);
    expect(sceneTree.controller).toBeDefined();
    expect(sceneTree.jwt).toBe(jwt);
  });

  it('initializes scene tree when setting viewer', async () => {
    const page = await newSpecPage({
      components: [SceneTree, Viewer],
      html: `
        <vertex-scene-tree></vertex-scene-tree>
        <vertex-viewer></vertex-viewer>
      `,
    });

    const sceneTree = page.body.querySelector(
      'vertex-scene-tree'
    ) as HTMLVertexSceneTreeElement;
    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;

    sceneTree.client = client;
    sceneTree.viewer = viewer;

    await loadModelForViewer(viewer, jwt, 'stream-key');

    await page.waitForChanges();

    expect(sceneTree.controller).toBeDefined();
    expect(sceneTree.jwt).toBeDefined();
  });
});

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
  const api = viewer.stream;
  (viewer.stream.connect as jest.Mock).mockResolvedValue({
    dispose: () => api.dispose(),
  });
  (viewer.stream.startStream as jest.Mock).mockResolvedValue(startStream);
  (viewer.stream.syncTime as jest.Mock).mockResolvedValue(syncTime);

  const loading = viewer.load(`urn:vertexvis:stream-key:${key}`);

  // Emit frame drawn on next event loop
  setTimeout(() => viewer.dispatchFrameDrawn(Fixtures.frame), 0);
  await loading;
  return viewer;
}
