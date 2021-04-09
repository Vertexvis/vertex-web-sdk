jest.mock(
  '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service'
);

import { grpc } from '@improbable-eng/grpc-web';
import {
  OffsetCursor,
  OffsetPager,
} from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import {
  ListChange,
  Node,
  TreeChangeType,
} from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import {
  CollapseAllRequest,
  CollapseNodeRequest,
  ExpandAllRequest,
  ExpandNodeRequest,
  GetTreeRequest,
  GetTreeResponse,
  SubscribeRequest,
  SubscribeResponse,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import {
  ResponseStream,
  SceneTreeAPIClient,
  Status,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { EventDispatcher } from '@vertexvis/utils';
import Chance from 'chance';
import { SceneTreeController } from '../controller';
import { fromNodeProto } from '../row';

const random = new Chance();

describe(SceneTreeController, () => {
  const sceneViewId = 'scene-view-id';
  const jwt = 'jwt';

  const client = new SceneTreeAPIClient('https://example.com');

  const metadata = new grpc.Metadata({
    'jwt-context': JSON.stringify({ jwt }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(SceneTreeController.prototype.subscribe, () => {
    const controller = new SceneTreeController(client, sceneViewId, 100);

    it('subscribes to remote changes', () => {
      const stream = new ResponseStreamMock();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      controller.subscribe(() => jwt);

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

      const disposable = controller.subscribe(() => jwt);
      disposable.dispose();

      expect(cancel).toHaveBeenCalled();
    });

    it('resubscribes on server termination', () => {
      const stream = new ResponseStreamMock();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      controller.subscribe(() => jwt);
      stream.invokeOnEnd();

      expect(client.subscribe).toHaveBeenCalledTimes(2);
    });

    it('fetches page when list changes', async (done) => {
      const getTree1 = createGetTreeResponse(10, 20);
      const getTree2 = createGetTreeResponse(20, 20);
      let onStateChangeCount = 0;

      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(getTree1)
      );

      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(getTree2)
      );

      await controller.fetchPage(0, jwt);

      const stream = new ResponseStreamMock<SubscribeResponse>();
      (client.subscribe as jest.Mock).mockReturnValue(stream);

      controller.onStateChange.on((state) => {
        onStateChangeCount++;
        if (onStateChangeCount === 2) {
          expect(state.rows).toHaveLength(20);
          done();
        }
      });
      controller.subscribe(() => jwt);

      const listChange = new ListChange();
      listChange.setStart(0);
      const changeType = new TreeChangeType();
      changeType.setListChange(listChange);
      const resp = new SubscribeResponse();
      resp.setChange(changeType);
      stream.invokeOnData(resp);
    });
  });

  describe(SceneTreeController.prototype.collapseNode, () => {
    const controller = new SceneTreeController(client, sceneViewId, 100);

    it('makes call to collapse node', () => {
      const viewId = new Uuid();
      viewId.setHex(sceneViewId);

      const nodeId = new Uuid();
      nodeId.setHex(random.guid());

      const req = new CollapseNodeRequest();
      req.setViewId(viewId);
      req.setNodeId(nodeId);

      controller.collapseNode(nodeId.getHex(), jwt);
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
        controller.collapseNode(random.guid(), jwt)
      ).rejects.toThrowError();
    });
  });

  describe(SceneTreeController.prototype.expandNode, () => {
    const controller = new SceneTreeController(client, sceneViewId, 100);

    it('makes call to expand node', () => {
      const viewId = new Uuid();
      viewId.setHex(sceneViewId);

      const nodeId = new Uuid();
      nodeId.setHex(random.guid());

      const req = new ExpandNodeRequest();
      req.setViewId(viewId);
      req.setNodeId(nodeId);

      controller.expandNode(nodeId.getHex(), jwt);
      expect(client.expandNode).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.expandAll, () => {
    const controller = new SceneTreeController(client, sceneViewId, 100);

    it('makes call to expand all nodes', () => {
      const req = new ExpandAllRequest();
      controller.expandAll(jwt);
      expect(client.expandAll).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.collapseAll, () => {
    const controller = new SceneTreeController(client, sceneViewId, 100);

    it('makes call to collapse all nodes', () => {
      const req = new CollapseAllRequest();
      controller.collapseAll(jwt);
      expect(client.collapseAll).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.fetchPage, () => {
    it('does nothing if index is outside bounds', async () => {
      const controller = new SceneTreeController(client, sceneViewId, 100);
      await controller.fetchPage(-1, jwt);
      await controller.fetchPage(1, jwt);
      expect(client.getTree).not.toHaveBeenCalled();
    });

    it('does nothing if page exists at index', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(1, 1))
      );

      const controller = new SceneTreeController(client, sceneViewId, 100);
      await controller.fetchPage(0, jwt);
      await controller.fetchPage(0, jwt);

      expect(client.getTree).toHaveBeenCalledTimes(1);
    });

    it('fetches page with correct offset', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(1, 1))
      );

      const controller = new SceneTreeController(client, sceneViewId, 100);
      await controller.fetchPage(0, jwt);

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
      const controller = new SceneTreeController(client, sceneViewId, 10);
      controller.onStateChange.on(onStateChange);

      await controller.fetchPage(0, jwt);

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: [...fromNodeProto(getTree1.getItemsList()), ...new Array(90)],
          totalRows: 100,
        })
      );

      await controller.fetchPage(1, jwt);
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

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);

      await controller.fetchPageAtOffset(-1, jwt);
      await controller.fetchPageAtOffset(100, jwt);

      expect(client.getTree).toHaveBeenCalledTimes(1);
    });

    it('fetches the correct page from given offset', async () => {
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);

      await controller.fetchPageAtOffset(10, jwt);

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

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);

      await controller.fetchRange(-1, 101, jwt);

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

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);
      (client.getTree as jest.Mock).mockClear();

      await controller.fetchRange(0, 100, jwt);

      // skips first page because its already been fetched
      expect(client.getTree).toHaveBeenCalledTimes(9);
    });
  });

  describe(SceneTreeController.prototype.getNonLoadedPageIndexes, () => {
    it('returns page indices for pages that have been fetched', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);
      await controller.fetchPage(1, jwt);

      const pages = controller.getNonLoadedPageIndexes(0, 100);
      expect(pages).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe(SceneTreeController.prototype.invalidatePagesOutsideRange, () => {
    it('removes pages that are furthest from start and end range', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);
      await controller.fetchRange(0, 100, jwt);

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

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);
      await controller.fetchRange(0, 100, jwt);

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

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);
      await controller.fetchRange(0, 100, jwt);

      const page = controller.getPageForOffset(101);
      expect(page).toBe(9);
    });
  });

  describe(SceneTreeController.prototype.getPageIndexesForRange, () => {
    it('constrains ranges', async () => {
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const controller = new SceneTreeController(client, sceneViewId, 10);
      await controller.fetchPage(0, jwt);
      await controller.fetchRange(0, 100, jwt);

      const range = controller.getPageIndexesForRange(-1, 101);
      expect(range).toEqual([0, 9]);
    });
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockGrpcUnaryResult(result: unknown): (...args: any[]) => unknown {
  return (_, __, handler) => {
    setTimeout(() => {
      handler(null, result);
    }, 10);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockGrpcUnaryError(error: Error): (...args: any[]) => unknown {
  return (_, __, handler) => {
    setTimeout(() => {
      handler(error);
    }, 10);
  };
}

function createGetTreeResponse(
  itemCount: number,
  totalCount: number
): GetTreeResponse {
  const nodes = Array.from({ length: itemCount }).map((_, i) => {
    const id = new Uuid();
    id.setHex(random.guid());
    const node = new Node();
    node.setId(id);
    node.setDepth(0);
    node.setExpanded(false);
    node.setIsLeaf(false);
    node.setName(random.string());
    node.setSelected(false);
    node.setVisible(false);
    return node;
  });

  const cursor = new OffsetCursor();
  cursor.setTotal(totalCount);

  const res = new GetTreeResponse();
  res.setItemsList(nodes);
  res.setCursor(cursor);

  return res;
}

class ResponseStreamMock<T> implements ResponseStream<T> {
  private onData = new EventDispatcher<T>();
  private onStatus = new EventDispatcher<Status>();
  private onEnd = new EventDispatcher<Status | undefined>();

  public cancel(): void {
    // no op
  }

  public on(type: string, handler: any): ResponseStream<T> {
    if (type === 'data') {
      this.onData.on(handler);
    } else if (type === 'end') {
      this.onEnd.on(handler);
    } else {
      this.onStatus.on(handler);
    }
    return this;
  }

  public invokeOnData(msg: T): void {
    this.onData.emit(msg);
  }

  public invokeOnEnd(status?: Status): void {
    this.onEnd.emit(status);
  }

  public invokeOnStatus(status: Status): void {
    this.onStatus.emit(status);
  }
}
