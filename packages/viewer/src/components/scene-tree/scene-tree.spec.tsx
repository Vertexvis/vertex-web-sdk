jest.mock('@vertexvis/stream-api');
jest.mock(
  '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service'
);
jest.mock('./lib/dom');
jest.mock('./lib/viewer-ops');
jest.mock('../viewer/utils');
jest.mock('../../lib/stencil');

import {
  SceneTreeAPIClient,
  ServiceError,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { SceneTree } from './scene-tree';
import { SceneTreeController } from './lib/controller';
import {
  CollapseNodeResponse,
  ExpandNodeResponse,
  GetAvailableColumnsResponse,
  GetNodeAncestorsResponse,
  GetTreeResponse,
  LocateItemResponse,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import {
  ColumnKey,
  Node,
} from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { Viewer } from '../viewer/viewer';
import { getElementBoundingClientRect } from '../viewer/utils';
import {
  getSceneTreeContainsElement,
  getSceneTreeOffsetTop,
  getSceneTreeViewportHeight,
  scrollToTop,
} from './lib/dom';
import { sign } from 'jsonwebtoken';
import Chance from 'chance';
import { decodeSceneTreeJwt } from './lib/jwt';
import { grpc } from '@improbable-eng/grpc-web';
import { deselectItem, hideItem, selectItem, showItem } from './lib/viewer-ops';
import { UInt64Value } from 'google-protobuf/google/protobuf/wrappers_pb';
import { loadModelForViewer } from '../../testing/viewer';
import {
  createGetTreeResponse,
  mockGrpcUnaryError,
  mockGrpcUnaryResult,
  ResponseStreamMock,
} from '../../testing';
import { SceneTreeTableLayout } from '../scene-tree-table-layout/scene-tree-table-layout';

const random = new Chance();

describe('<vertex-scene-tree>', () => {
  const sceneViewId = random.guid();
  const jwt = signJwt(sceneViewId);

  // Viewer mocks
  (getElementBoundingClientRect as jest.Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 150,
    right: 200,
    width: 200,
    height: 150,
  });

  // Scene tree mocks
  (getSceneTreeViewportHeight as jest.Mock).mockReturnValue(1000);
  (getSceneTreeOffsetTop as jest.Mock).mockReturnValue(0);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('finds viewer from a selector', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      const { tree } = await newSceneTreeSpec({
        controller,
        template: () => (
          <div>
            <vertex-scene-tree
              controller={controller}
              viewerSelector="#viewer"
            ></vertex-scene-tree>
            <vertex-viewer id="viewer"></vertex-viewer>
          </div>
        ),
      });
      expect(tree.viewer).toBeDefined();
    });

    it('fetches tree when viewer is ready', async () => {
      const client = mockSceneTreeClient();
      mockGetTree({ client });

      const controller = new SceneTreeController(client, 100);
      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });

      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      expect(
        tree?.querySelectorAll('vertex-scene-tree-table-cell')?.length
      ).toBeGreaterThan(0);
    });

    it('fetches tree when viewer scene view changes', async () => {
      const client = mockSceneTreeClient();
      mockGetTree({ client });

      const rowData = jest.fn();
      const controller = new SceneTreeController(client, 100);
      const { viewer, page, waitForSceneTreeConnected } =
        await newSceneTreeSpec({
          controller,
          template: () => (
            <div>
              <vertex-scene-tree
                controller={controller}
                rowData={rowData}
                viewerSelector="#viewer"
              ></vertex-scene-tree>
              <vertex-viewer id="viewer"></vertex-viewer>
            </div>
          ),
        });

      await loadModelForViewer(viewer, {
        jwt,
        streamKey: decodeSceneTreeJwt(jwt).view,
      });
      await waitForSceneTreeConnected();
      await page.waitForChanges();
      expect(rowData).toHaveBeenCalled();
      rowData.mockClear();
      const newJwt = signJwt(random.guid());
      await loadModelForViewer(viewer, {
        jwt: newJwt,
        streamKey: decodeSceneTreeJwt(newJwt).view,
      });
      await waitForSceneTreeConnected();
      await page.waitForChanges();

      expect(rowData).toHaveBeenCalled();
    });

    it('emits error if tree is not enabled', async (done) => {
      const client = mockSceneTreeClient();
      mockGetTreeError(client, grpc.Code.FailedPrecondition);

      const controller = new SceneTreeController(client, 100);
      const { viewer } = await newSceneTreeSpec({
        controller,
        template: () => (
          <div>
            <vertex-scene-tree
              controller={controller}
              onConnectionError={() => done()}
              viewerSelector="#viewer"
            ></vertex-scene-tree>
            <vertex-viewer id="viewer"></vertex-viewer>
          </div>
        ),
      });
      await loadModelForViewer(viewer, { jwt });
    });

    it('renders message if load failed', async () => {
      const client = mockSceneTreeClient();
      mockGetTreeError(client, grpc.Code.FailedPrecondition);

      const controller = new SceneTreeController(client, 100);
      const { tree, viewer } = await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });

      const errorEl = tree.shadowRoot?.querySelector('.error');
      expect(errorEl).toBeDefined();
    });
  });

  describe('viewer', () => {
    it('fetches tree for scene view of new viewer', async () => {
      const client = mockSceneTreeClient();
      mockGetTree({ client });

      const controller = new SceneTreeController(client, 100);
      const { tree, viewer, page, waitForSceneTreeConnected } =
        await newSceneTreeSpec({
          controller,
          template: () => (
            <div>
              <vertex-scene-tree
                controller={controller}
                viewerSelector="#viewer1"
              ></vertex-scene-tree>
              <vertex-viewer id="viewer1"></vertex-viewer>
              <vertex-viewer id="viewer2"></vertex-viewer>
            </div>
          ),
        });

      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const res = mockGetTree({ client });
      const newJwt = signJwt(random.guid());
      const newViewer = page.body.querySelector(
        '#viewer2'
      ) as HTMLVertexViewerElement;
      tree.viewer = newViewer;
      await page.waitForChanges();
      await loadModelForViewer(newViewer, { jwt: newJwt });
      await waitForSceneTreeConnected();

      const row = tree.querySelectorAll(
        'vertex-scene-tree-table-cell'
      )[0] as HTMLVertexSceneTreeTableCellElement;
      expect(row.node?.name).toEqual(res.toObject().itemsList[0].name);
    });
  });

  describe(SceneTree.prototype.invalidateRows, async () => {
    it('rerenders each row', async () => {
      const client = mockSceneTreeClient();
      mockGetTree({ client });

      const rowData = jest.fn();
      const controller = new SceneTreeController(client, 100);
      const { tree, viewer, page, waitForSceneTreeConnected } =
        await newSceneTreeSpec({
          controller,
          template: () => (
            <div>
              <vertex-scene-tree
                controller={controller}
                rowData={rowData}
                viewerSelector="#viewer"
              ></vertex-scene-tree>
              <vertex-viewer id="viewer"></vertex-viewer>
            </div>
          ),
        });

      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      rowData.mockClear();
      await tree.invalidateRows();
      await page.waitForChanges();

      expect(rowData).toHaveBeenCalled();
    });
  });

  describe(SceneTree.prototype.getRowAtIndex, () => {
    it('returns row at index', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      const res = mockGetTree({ client });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(1);
      expect(row?.node.name).toBe(res.toObject().itemsList[1].name);
    });
  });

  describe(SceneTree.prototype.getRowForEvent, () => {
    it('returns row for event', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      const res = mockGetTree({ client });
      (getSceneTreeContainsElement as jest.Mock).mockReturnValue(true);

      const { tree, page, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const pendingEvent = new Promise<MouseEvent>((resolve) => {
        const cellEl = page.root?.querySelectorAll(
          'vertex-scene-tree-table-cell'
        )[1];
        cellEl?.addEventListener('click', (event) =>
          resolve(event as MouseEvent)
        );
      });

      const cellEl = page.root?.querySelectorAll(
        'vertex-scene-tree-table-cell'
      )[1];
      cellEl?.dispatchEvent(new MouseEvent('click', { clientY: 30 }));

      const event = await pendingEvent;
      const row = await tree.getRowForEvent(event);
      expect(row?.node.name).toBe(res.toObject().itemsList[1].name);
    });

    it('returns undefined if no current target', async () => {
      const client = mockSceneTreeClient();
      mockGetTree({ client });
      const controller = new SceneTreeController(client, 100);

      (getSceneTreeContainsElement as jest.Mock).mockReturnValue(true);

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowForEvent(
        new MouseEvent('click', { clientY: 30 })
      );
      expect(row).not.toBeDefined();
    });
  });

  describe(SceneTree.prototype.getRowAtClientY, () => {
    it('returns row at vertical position', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      const res = mockGetTree({ client });
      (getSceneTreeContainsElement as jest.Mock).mockReturnValue(true);

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtClientY(30);
      expect(row?.node.name).toBe(res.toObject().itemsList[1].name);
    });
  });

  describe(SceneTree.prototype.expandItem, () => {
    it('expands item if index collapsed', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);
      mockGetTree({ client, transform: (node) => node.setExpanded(false) });

      (client.expandNode as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(new ExpandNodeResponse())
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.expandItem(0);
      expect(client.expandNode).toHaveBeenCalled();
    });

    it('does nothing if item expanded', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);
      mockGetTree({ client, transform: (node) => node.setExpanded(true) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.expandItem(0);
      expect(client.expandNode).not.toHaveBeenCalled();
    });
  });

  describe(SceneTree.prototype.collapseItem, () => {
    it('collapses item if index changed', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setExpanded(true) });
      (client.collapseNode as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(new CollapseNodeResponse())
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.collapseItem(0);
      expect(client.collapseNode).toHaveBeenCalled();
    });

    it('does nothing if item collapsed', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);
      mockGetTree({ client, transform: (node) => node.setExpanded(false) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.collapseItem(0);
      expect(client.collapseNode).not.toHaveBeenCalled();
    });
  });

  describe(SceneTree.prototype.toggleExpandItem, () => {
    it('collapses item if index expanded', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setExpanded(true) });
      (client.collapseNode as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(new CollapseNodeResponse())
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.toggleExpandItem(0);
      expect(client.collapseNode).toHaveBeenCalled();
    });

    it('expands item if index collapsed', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setExpanded(false) });
      (client.expandNode as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(new ExpandNodeResponse())
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.toggleExpandItem(0);
      expect(client.expandNode).toHaveBeenCalled();
    });
  });

  describe(SceneTree.prototype.toggleItemVisibility, () => {
    it('shows item if index hidden', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(false) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.toggleItemVisibility(0);
      expect(showItem).toHaveBeenCalled();
    });

    it('hides item if index visible', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(true) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({
          controller,
        });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.toggleItemVisibility(0);
      expect(hideItem).toHaveBeenCalled();
    });

    it('shows item if row hidden', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(false) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(0);
      await tree.toggleItemVisibility(row);
      expect(showItem).toHaveBeenCalled();
    });
  });

  describe(SceneTree.prototype.showItem, () => {
    it('shows item if row hidden', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(false) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(0);
      await tree.showItem(row);
      expect(showItem).toHaveBeenCalled();
    });

    it('shows item if index hidden', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(false) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.showItem(0);
      expect(showItem).toHaveBeenCalled();
    });

    it('does nothing if row is visible', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(true) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.showItem(0);
      expect(showItem).not.toHaveBeenCalled();
    });
  });

  describe(SceneTree.prototype.hideItem, () => {
    it('hides item if row visible', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(true) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(0);
      await tree.hideItem(row);
      expect(hideItem).toHaveBeenCalled();
    });

    it('hides item if index visible', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(true) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.hideItem(0);
      expect(hideItem).toHaveBeenCalled();
    });

    it('does nothing if index is hidden', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setVisible(false) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.hideItem(0);
      expect(hideItem).not.toHaveBeenCalled();
    });
  });

  describe(SceneTree.prototype.selectItem, () => {
    it('selects item if row deselected', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setSelected(false) });

      const res = new GetNodeAncestorsResponse();
      (client.getNodeAncestors as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(res)
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(0);
      await tree.selectItem(row);
      expect(selectItem).toHaveBeenCalled();
    });

    it('selects item if row selected', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setSelected(true) });

      const res = new GetNodeAncestorsResponse();
      (client.getNodeAncestors as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(res)
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(0);
      await tree.selectItem(row);
      expect(selectItem).toHaveBeenCalled();
    });

    it('appends selection if flag is set', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setSelected(false) });

      const res = new GetNodeAncestorsResponse();
      (client.getNodeAncestors as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(res)
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(0);
      await tree.selectItem(row, { append: true });
      expect(selectItem).toHaveBeenCalledWith(
        expect.anything(),
        row?.node.id?.hex,
        expect.objectContaining({ append: true })
      );
    });

    it('selects first unselected parent if node belongs to selection path', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      const getTreeRes = mockGetTree({
        client,
        transform: (node) => node.setSelected(false),
      });

      const node1 = getTreeRes.getItemsList()[0].clone();
      const node2 = getTreeRes.getItemsList()[1].clone();
      node2.setSelected(true);
      const node3 = getTreeRes.getItemsList()[2].clone();
      node3.setSelected(true);
      const ancestry = [node1, node2, node3];

      const res = new GetNodeAncestorsResponse();
      res.setItemsList(ancestry);
      (client.getNodeAncestors as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(res)
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(2);
      await tree.selectItem(row, { recurseParent: true });

      (selectItem as jest.Mock).mockClear();
      await tree.selectItem(row, { recurseParent: true });
      expect(selectItem).toHaveBeenCalledWith(
        expect.anything(),
        node1.getId()?.getHex(),
        expect.anything()
      );
    });
  });

  describe(SceneTree.prototype.deselectItem, () => {
    it('deselects item if row selected', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setSelected(true) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const row = await tree.getRowAtIndex(0);
      await tree.deselectItem(row);
      expect(deselectItem).toHaveBeenCalled();
    });

    it('does nothing if row deselected', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client, transform: (node) => node.setSelected(false) });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.deselectItem(0);
      expect(deselectItem).not.toHaveBeenCalled();
    });
  });

  describe(SceneTree.prototype.scrollToIndex, () => {
    beforeEach(() => {
      (getSceneTreeViewportHeight as jest.Mock).mockReturnValue(240);
    });

    it('positions item at viewport start', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.scrollToIndex(1, { position: 'start' });
      expect(scrollToTop).toHaveBeenCalledWith(
        expect.anything(),
        24,
        expect.anything()
      );
    });

    it('positions item in viewport middle', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.scrollToIndex(50, { position: 'middle' });
      expect(scrollToTop).toHaveBeenCalledWith(
        expect.anything(),
        1092,
        expect.anything()
      );
    });

    it('positions item at viewport end', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      await tree.scrollToIndex(99, { position: 'end' });
      expect(scrollToTop).toHaveBeenCalledWith(
        expect.anything(),
        2160,
        expect.anything()
      );
    });
  });

  describe(SceneTree.prototype.scrollToItem, () => {
    it('scrolls to the index of the item', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client });

      const index = new UInt64Value();
      index.setValue(10);
      const res = new LocateItemResponse();
      res.setLocatedIndex(index);

      (client.locateItem as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(res)
      );

      const { viewer, waitForSceneTreeConnected, page } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const tree = page.rootInstance as SceneTree;

      const scrollToIndex = jest.spyOn(tree, 'scrollToIndex');

      await tree.scrollToItem('item-id');
      expect(scrollToIndex).toHaveBeenCalledWith(10, expect.anything());
    });
  });

  describe('fetch metadata keys', () => {
    it('fetches available metadata keys', async () => {
      const key = new ColumnKey();
      key.setValue('val1');
      const res = new GetAvailableColumnsResponse();
      res.addKeys(key);

      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      mockGetTree({ client });
      (client.getAvailableColumns as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(res)
      );

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      const keys = await tree.fetchMetadataKeys();
      expect(keys).toEqual(['val1']);
    });
  });

  describe('metadata keys', () => {
    it('fetches metadata when tree is initialized', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);
      const rowData = jest.fn();

      mockGetTree({
        client,
        transform: (node) => node.setColumnsList(['val1', 'val2']),
      });

      const { tree, viewer, waitForSceneTreeConnected } =
        await newSceneTreeSpec({ controller });

      tree.rowData = rowData;
      tree.metadataKeys = ['key1', 'key2'];
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      expect(rowData).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { key1: 'val1', key2: 'val2' },
        })
      );
    });

    it('fetches metadata when metadata keys are set', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);
      const rowData = jest.fn();

      mockGetTree({ client });

      const { tree, viewer, waitForSceneTreeConnected, page } =
        await newSceneTreeSpec({ controller });
      await loadModelForViewer(viewer, { jwt });
      await waitForSceneTreeConnected();

      mockGetTree({
        client,
        transform: (node) => node.setColumnsList(['val1', 'val2']),
      });
      tree.rowData = rowData;
      tree.metadataKeys = ['key1', 'key2'];

      // Wait for the controller to fetch and emit new pages and for Stencil to
      // rerender.
      await new Promise((resolve) => {
        controller.onStateChange.on(resolve);
      });
      await page.waitForChanges();

      expect(rowData).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { key1: 'val1', key2: 'val2' },
        })
      );
    });
  });

  describe('search', () => {
    it('creates a search element if header slot is empty', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);

      const { tree } = await newSceneTreeSpec({ controller });

      const search = tree.shadowRoot?.querySelector('vertex-scene-tree-search');
      expect(search).toBeDefined();
    });

    it('performs a search element when search event is emitted', async () => {
      const client = mockSceneTreeClient();
      const controller = new SceneTreeController(client, 100);
      const filter = jest.spyOn(controller, 'filter');

      const { tree } = await newSceneTreeSpec({ controller });

      tree.dispatchEvent(new CustomEvent('search', { detail: 'term' }));
      expect(filter).toHaveBeenCalledWith('term', expect.anything());
    });
  });
});

async function newSceneTreeSpec(data: {
  controller: SceneTreeController;
  template?: () => unknown;
  setup?: (data: { client: SceneTreeAPIClient }) => void;
}): Promise<{
  tree: HTMLVertexSceneTreeElement;
  viewer: HTMLVertexViewerElement;
  page: SpecPage;
  waitForSceneTreeConnected: () => Promise<void>;
}> {
  const page = await newSpecPage({
    components: [SceneTree, SceneTreeTableLayout, Viewer],
    template: () => {
      return (
        data.template?.() || (
          <div>
            <vertex-scene-tree
              controller={data.controller}
              viewerSelector="#viewer"
            />
            <vertex-viewer id="viewer" />
          </div>
        )
      );
    },
  });

  const tree = page.body.querySelector(
    'vertex-scene-tree'
  ) as HTMLVertexSceneTreeElement;
  const viewer = page.body.querySelector(
    'vertex-viewer'
  ) as HTMLVertexViewerElement;

  return {
    tree,
    viewer,
    page,
    waitForSceneTreeConnected: async () => {
      await new Promise<void>((resolve) => {
        data.controller.onStateChange.on((state) => {
          if (state.connection.type === 'connected') {
            resolve();
          }
        });
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

function mockGetTreeError(client: SceneTreeAPIClient, code: grpc.Code): void {
  const error: ServiceError = {
    code,
    message: 'Scene tree test error',
    metadata: new grpc.Metadata({}),
  };
  (client.getTree as jest.Mock).mockImplementationOnce(
    mockGrpcUnaryError(error)
  );
}

function signJwt(viewId: string): string {
  return sign(
    {
      aud: 'vertex-api',
      iss: 'frame-streaming-service-platdev',
      iat: 1618269253,
      sub: '23bccce9-1cb1-4b4f-88b3-5808e6dfed78',
      scene: 'd12e5340-b329-4654-9f7e-68e556637b38',
      view: viewId,
      exp: 1618269553,
    },
    'secret'
  );
}
