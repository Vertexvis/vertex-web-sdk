jest.mock(
  '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service'
);

import { grpc } from '@improbable-eng/grpc-web';
import { OffsetPager } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import {
  ListChange,
  Range,
  StateChange,
  TreeChangeType,
} from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import {
  CollapseAllRequest,
  CollapseNodeRequest,
  ExpandAllRequest,
  ExpandNodeRequest,
  GetTreeRequest,
  SubscribeRequest,
  SubscribeResponse,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import { SceneTreeAPIClient } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { sign } from 'jsonwebtoken';
import Chance from 'chance';
import { SceneTreeController } from '../controller';
import { fromNodeProto, Row } from '../row';
import {
  createGetTreeResponse,
  mockGrpcUnaryError,
  mockGrpcUnaryResult,
  ResponseStreamMock,
} from '../testing';

const random = new Chance();

describe(SceneTreeController, () => {
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

  const client = new SceneTreeAPIClient('https://example.com');

  const metadata = new grpc.Metadata({
    'jwt-context': JSON.stringify({ jwt }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(SceneTreeController.prototype.subscribe, () => {
    it('subscribes to remote changes', () => {
      const stream = new ResponseStreamMock();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      const controller = new SceneTreeController(client, 10, () => jwt);
      controller.subscribe();

      const viewId = new Uuid();
      viewId.setHex(sceneViewId);

      const req = new SubscribeRequest();
      req.setViewId(viewId);

      expect(client.subscribe).toHaveBeenCalledWith(req, metadata);
    });

    it('cancels subscription when disposed', () => {
      const stream = new ResponseStreamMock();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      const cancel = jest.spyOn(stream, 'cancel');

      const controller = new SceneTreeController(client, 10, () => jwt);
      const disposable = controller.subscribe();
      disposable.dispose();

      expect(cancel).toHaveBeenCalled();
    });

    it('resubscribes on server termination', () => {
      const stream = new ResponseStreamMock();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      const controller = new SceneTreeController(client, 10, () => jwt);
      controller.subscribe();
      stream.invokeOnEnd();

      expect(client.subscribe).toHaveBeenCalledTimes(2);
    });

    it('fetches page when list changes', async () => {
      const getTree1 = createGetTreeResponse(10, 20);
      const getTree2 = createGetTreeResponse(10, 20);

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree1)
      );

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree2)
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);
      await controller.fetchPage(1);
      controller.updateActiveRowRange(0, 9);

      const stream = new ResponseStreamMock<SubscribeResponse>();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      const pendingRows = new Promise((resolve) => {
        let onStateChangeCount = 0;
        controller.onStateChange.on((state) => {
          onStateChangeCount++;
          if (onStateChangeCount === 2) {
            resolve(state.rows);
          }
        });
      });
      controller.subscribe();

      const listChange = new ListChange();
      listChange.setStart(0);
      const changeType = new TreeChangeType();
      changeType.setListChange(listChange);
      const resp = new SubscribeResponse();
      resp.setChange(changeType);
      stream.invokeOnData(resp);

      const rows = await pendingRows;
      expect(rows).toHaveLength(20);
    });

    it('patches data that has been hidden', async () => {
      const getTree = createGetTreeResponse(100, 100, (node) =>
        node.setVisible(true)
      );

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );

      const controller = new SceneTreeController(client, 100, () => jwt);
      await controller.fetchPage(0);

      const stream = new ResponseStreamMock<SubscribeResponse>();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      controller.subscribe();

      const pendingRows = new Promise<Row[]>((resolve) => {
        controller.onStateChange.on((state) => {
          resolve(state.rows);
        });
      });

      const range = new Range();
      range.setStart(0);
      range.setEnd(1);
      const stateChange = new StateChange();
      stateChange.setHiddenList([range]);
      const changeType = new TreeChangeType();
      changeType.setRanges(stateChange);
      const resp = new SubscribeResponse();
      resp.setChange(changeType);
      stream.invokeOnData(resp);

      const rows = await pendingRows;

      expect(rows.slice(0, 3)).toMatchObject([
        { ...rows[0], visible: false },
        { ...rows[1], visible: false },
        { ...rows[2], visible: true },
      ]);
    });

    it('patches data that has been shown', async () => {
      const getTree = createGetTreeResponse(100, 100, (node) =>
        node.setVisible(false)
      );

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );

      const controller = new SceneTreeController(client, 100, () => jwt);
      await controller.fetchPage(0);

      const stream = new ResponseStreamMock<SubscribeResponse>();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      controller.subscribe();

      const pendingRows = new Promise<Row[]>((resolve) => {
        controller.onStateChange.on((state) => {
          resolve(state.rows);
        });
      });

      const range = new Range();
      range.setStart(0);
      range.setEnd(1);
      const stateChange = new StateChange();
      stateChange.setShownList([range]);
      const changeType = new TreeChangeType();
      changeType.setRanges(stateChange);
      const resp = new SubscribeResponse();
      resp.setChange(changeType);
      stream.invokeOnData(resp);

      const rows = await pendingRows;

      expect(rows.slice(0, 3)).toMatchObject([
        { ...rows[0], visible: true },
        { ...rows[1], visible: true },
        { ...rows[2], visible: false },
      ]);
    });

    it('patches data that has been selected', async () => {
      const getTree = createGetTreeResponse(100, 100, (node) =>
        node.setSelected(false)
      );

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );

      const controller = new SceneTreeController(client, 100, () => jwt);
      await controller.fetchPage(0);

      const stream = new ResponseStreamMock<SubscribeResponse>();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      controller.subscribe();

      const pendingRows = new Promise<Row[]>((resolve) => {
        controller.onStateChange.on((state) => {
          resolve(state.rows);
        });
      });

      const range = new Range();
      range.setStart(0);
      range.setEnd(1);
      const stateChange = new StateChange();
      stateChange.setSelectedList([range]);
      const changeType = new TreeChangeType();
      changeType.setRanges(stateChange);
      const resp = new SubscribeResponse();
      resp.setChange(changeType);
      stream.invokeOnData(resp);

      const rows = await pendingRows;

      expect(rows.slice(0, 3)).toMatchObject([
        { ...rows[0], selected: true },
        { ...rows[1], selected: true },
        { ...rows[2], selected: false },
      ]);
    });

    it('patches data that has been deselected', async () => {
      const getTree = createGetTreeResponse(100, 100, (node) =>
        node.setSelected(true)
      );

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );

      const controller = new SceneTreeController(client, 100, () => jwt);
      await controller.fetchPage(0);

      const stream = new ResponseStreamMock<SubscribeResponse>();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      controller.subscribe();

      const pendingRows = new Promise<Row[]>((resolve) => {
        controller.onStateChange.on((state) => {
          resolve(state.rows);
        });
      });

      const range = new Range();
      range.setStart(0);
      range.setEnd(1);
      const stateChange = new StateChange();
      stateChange.setDeselectedList([range]);
      const changeType = new TreeChangeType();
      changeType.setRanges(stateChange);
      const resp = new SubscribeResponse();
      resp.setChange(changeType);
      stream.invokeOnData(resp);

      const rows = await pendingRows;

      expect(rows.slice(0, 3)).toMatchObject([
        { ...rows[0], selected: false },
        { ...rows[1], selected: false },
        { ...rows[2], selected: true },
      ]);
    });
  });

  describe(SceneTreeController.prototype.collapseNode, () => {
    const controller = new SceneTreeController(client, 100, () => jwt);

    it('makes call to collapse node', () => {
      const viewId = new Uuid();
      viewId.setHex(sceneViewId);

      const nodeId = new Uuid();
      nodeId.setHex(random.guid());

      const req = new CollapseNodeRequest();
      req.setViewId(viewId);
      req.setNodeId(nodeId);

      controller.collapseNode(nodeId.getHex());
      expect(client.collapseNode).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });

    it('throws if grpc call errors', () => {
      (client.collapseNode as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryError(new Error('oops'))
      );

      return expect(
        controller.collapseNode(random.guid())
      ).rejects.toThrowError();
    });

    it('throws if grpc error and result are null', () => {
      (client.collapseNode as jest.Mock).mockImplementationOnce(
        (_, __, handler) => handler(null, null)
      );

      return expect(
        controller.collapseNode(random.guid())
      ).rejects.toThrowError();
    });
  });

  describe(SceneTreeController.prototype.expandNode, () => {
    const controller = new SceneTreeController(client, 100, () => jwt);

    it('makes call to expand node', () => {
      const viewId = new Uuid();
      viewId.setHex(sceneViewId);

      const nodeId = new Uuid();
      nodeId.setHex(random.guid());

      const req = new ExpandNodeRequest();
      req.setViewId(viewId);
      req.setNodeId(nodeId);

      controller.expandNode(nodeId.getHex());
      expect(client.expandNode).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.expandAll, () => {
    const controller = new SceneTreeController(client, 100, () => jwt);

    it('makes call to expand all nodes', () => {
      const req = new ExpandAllRequest();
      controller.expandAll();
      expect(client.expandAll).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.collapseAll, () => {
    const controller = new SceneTreeController(client, 100, () => jwt);

    it('makes call to collapse all nodes', () => {
      const req = new CollapseAllRequest();
      controller.collapseAll();
      expect(client.collapseAll).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.fetchPage, () => {
    it('does nothing if index is outside bounds', async () => {
      const controller = new SceneTreeController(client, 100, () => jwt);
      await controller.fetchPage(-1);
      await controller.fetchPage(1);
      expect(client.getTree).not.toHaveBeenCalled();
    });

    it('does nothing if page exists at index', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(1, 1))
      );

      const controller = new SceneTreeController(client, 100, () => jwt);
      await controller.fetchPage(0);
      await controller.fetchPage(0);

      expect(client.getTree).toHaveBeenCalledTimes(1);
    });

    it('fetches page with correct offset', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(1, 1))
      );

      const controller = new SceneTreeController(client, 100, () => jwt);
      await controller.fetchPage(0);

      const viewId = new Uuid();
      viewId.setHex(sceneViewId);
      const pager = new OffsetPager();
      pager.setOffset(0);
      pager.setLimit(100);

      const req = new GetTreeRequest();
      req.setViewId(viewId);
      req.setPager(pager);

      expect(client.getTree).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });

    it('state change contains fetched rows and total count', async () => {
      const getTree1 = createGetTreeResponse(10, 100);
      const getTree2 = createGetTreeResponse(10, 100);

      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(getTree1)
      );
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(getTree2)
      );

      const onStateChange = jest.fn();
      const controller = new SceneTreeController(client, 10, () => jwt);
      controller.onStateChange.on(onStateChange);

      await controller.fetchPage(0);

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: [...fromNodeProto(getTree1.getItemsList()), ...new Array(90)],
          totalRows: 100,
        })
      );

      await controller.fetchPage(1);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: [
            ...fromNodeProto(getTree1.getItemsList()),
            ...fromNodeProto(getTree2.getItemsList()),
            ...new Array(80),
          ],
          totalRows: 100,
        })
      );
    });
  });

  describe(SceneTreeController.prototype.fetchPageAtOffset, () => {
    it('does nothing if index is outside bounds', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);

      await controller.fetchPageAtOffset(-1);
      await controller.fetchPageAtOffset(100);

      expect(client.getTree).toHaveBeenCalledTimes(1);
    });

    it('fetches the correct page from given offset', async () => {
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);

      await controller.fetchPageAtOffset(10);

      const viewId = new Uuid();
      viewId.setHex(sceneViewId);
      const pager = new OffsetPager();
      pager.setOffset(10);
      pager.setLimit(10);

      const req = new GetTreeRequest();
      req.setViewId(viewId);
      req.setPager(pager);

      expect(client.getTree).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.fetchRange, () => {
    it('constrains range', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);

      await controller.fetchRange(-1, 101);

      const viewId = new Uuid();
      viewId.setHex(sceneViewId);

      const pager1 = new OffsetPager();
      pager1.setOffset(0);
      pager1.setLimit(10);

      const pager2 = new OffsetPager();
      pager2.setOffset(90);
      pager2.setLimit(10);

      const req1 = new GetTreeRequest();
      req1.setViewId(viewId);
      req1.setPager(pager1);

      const req2 = new GetTreeRequest();
      req2.setViewId(viewId);
      req2.setPager(pager1);

      expect(client.getTree).toHaveBeenCalledWith(
        req1,
        metadata,
        expect.anything()
      );
      expect(client.getTree).toHaveBeenCalledWith(
        req2,
        metadata,
        expect.anything()
      );
    });

    it('fetches for each page', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);
      (client.getTree as jest.Mock).mockClear();

      await controller.fetchRange(0, 100);

      // skips first page because its already been fetched
      expect(client.getTree).toHaveBeenCalledTimes(9);
    });
  });

  describe(SceneTreeController.prototype.getNonLoadedPageIndexes, () => {
    it('returns page indices for pages that have been fetched', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);
      await controller.fetchPage(1);

      const pages = controller.getNonLoadedPageIndexes(0, 100);
      expect(pages).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe(SceneTreeController.prototype.invalidatePagesOutsideRange, () => {
    it('removes pages that are furthest from start and end range', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);
      await controller.fetchRange(0, 100);

      controller.invalidatePagesOutsideRange(4, 5, 4);

      const pages = Array.from({ length: 10 })
        .map((_, page) => page)
        .filter((page) => controller.isPageLoaded(page));

      expect(pages).toEqual([3, 4, 5, 6]);
    });

    it('does nothing if threshold is not met', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);
      await controller.fetchRange(0, 100);

      controller.invalidatePagesOutsideRange(4, 5, 10);

      const pages = Array.from({ length: 10 })
        .map((_, page) => page)
        .filter((page) => controller.isPageLoaded(page));

      expect(pages).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe(SceneTreeController.prototype.getPageForOffset, () => {
    it('constrains offset', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);
      await controller.fetchRange(0, 100);

      const page = controller.getPageForOffset(101);
      expect(page).toBe(9);
    });
  });

  describe(SceneTreeController.prototype.getPageIndexesForRange, () => {
    it('constrains ranges', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);
      await controller.fetchRange(0, 100);

      const range = controller.getPageIndexesForRange(-1, 101);
      expect(range).toEqual([0, 9]);
    });
  });

  describe(SceneTreeController.prototype.updateActiveRowRange, () => [
    it('fetches pages in active rows that have not been fetched', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, 10, () => jwt);
      await controller.fetchPage(0);

      const pendingRows = new Promise<Row[]>((resolve) => {
        controller.onStateChange.on((state) => resolve(state.rows));
      });

      controller.updateActiveRowRange(0, 9);
      controller.updateActiveRowRange(10, 19);

      const rows = await pendingRows;
      expect(rows.slice(0, 20).every((row) => row != null)).toBe(true);
    }),
  ]);
});
