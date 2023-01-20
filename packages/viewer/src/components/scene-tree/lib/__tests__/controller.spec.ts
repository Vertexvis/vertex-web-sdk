jest.mock(
  '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service'
);

import { grpc } from '@improbable-eng/grpc-web';
import { OffsetPager } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import {
  ColumnKey,
  ListChange,
  Range,
  StateChange,
  TreeChangeType,
} from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import {
  CollapseAllRequest,
  CollapseAllResponse,
  CollapseNodeRequest,
  CollapseNodeResponse,
  ExpandAllRequest,
  ExpandAllResponse,
  ExpandNodeRequest,
  ExpandNodeResponse,
  FilterRequest,
  FilterResponse,
  GetAvailableColumnsResponse,
  GetTreeRequest,
  Handshake,
  LocateItemResponse,
  SubscribeRequest,
  SubscribeResponse,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import {
  SceneTreeAPIClient,
  ServiceError,
  Status,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { Async } from '@vertexvis/utils';
import { UInt64Value } from 'google-protobuf/google/protobuf/wrappers_pb';
import { sign } from 'jsonwebtoken';

import {
  createGetTreeResponse,
  mockGrpcUnaryError,
  mockGrpcUnaryResult,
  random,
  ResponseStreamMock,
} from '../../../../testing';
import { SceneTreeController, SceneTreeState } from '../controller';
import { SceneTreeErrorCode, SceneTreeErrorDetails } from '../errors';
import { fromNodeProto, Row } from '../row';

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

function createController(
  rowLimit: number,
  subscriptionHandshakeGracePeriodInMs?: number
): {
  controller: SceneTreeController;
  client: SceneTreeAPIClient;
  stream: ResponseStreamMock<unknown>;
} {
  const client = new SceneTreeAPIClient('https://example.com');
  const controller = new SceneTreeController(client, rowLimit, {
    lostConnectionReconnectInSeconds: 0.025,
    spinnerDelay: 2000,
    subscriptionHandshakeGracePeriodInMs:
      subscriptionHandshakeGracePeriodInMs || 1000,
  });

  const stream = new ResponseStreamMock<SubscribeResponse>();
  (client.subscribe as jest.Mock).mockReturnValue(stream);

  return { controller, client, stream };
}

describe(SceneTreeController, () => {
  const sceneViewId = random.guid();
  const jwt = signJwt(sceneViewId);
  const jwtProvider = (): string => jwt;

  const metadata = new grpc.Metadata({
    'jwt-context': JSON.stringify({ jwt }),
  });

  const initiateHandshakeOnStream = (
    stream: ResponseStreamMock<unknown>
  ): void => {
    const resp = new SubscribeResponse();
    resp.setHandshake(new Handshake());

    stream.invokeOnData(resp);
  };

  const waitForConnection = async (
    stream: ResponseStreamMock<unknown>,
    controller: SceneTreeController
  ): Promise<void> => {
    initiateHandshakeOnStream(stream);
    await new Promise((resolve) => {
      controller.onStateChange.on((state: SceneTreeState) => {
        const connected = state.connection.type === 'connected';
        if (connected) {
          resolve(connected);
        }
      });
    });
  };

  describe(SceneTreeController.prototype.connect, () => {
    it('emits connecting and connected state changes', async () => {
      const { controller, client, stream } = createController(10);
      const getTree = createGetTreeResponse(10, 100, (node) =>
        node.setVisible(false)
      );
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );
      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);
      await controller.connect(jwtProvider);

      initiateHandshakeOnStream(stream);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({
            type: 'connecting',
          }),
        })
      );
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          totalRows: 100,
        })
      );
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({
            type: 'connected',
          }),
        })
      );
    });

    it('does not clear rows in disconnected state if scene views are same', async () => {
      const { controller, client, stream } = createController(10);
      const getTree = createGetTreeResponse(10, 100, (node) =>
        node.setVisible(false)
      );
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      let connectedState: SceneTreeState | undefined;

      controller.onStateChange.on((state) => {
        if (state.connection.type === 'connected') {
          connectedState = state;
        }
      });
      await controller.connect(jwtProvider);
      initiateHandshakeOnStream(stream);

      onStateChange.mockClear();
      await controller.connect(jwtProvider);

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({ type: 'disconnected' }),
          rows: connectedState?.rows,
        })
      );
    });

    it('disconnects if connected', async () => {
      const { controller, client, stream } = createController(10);
      const getTree1 = createGetTreeResponse(10, 100, (node) =>
        node.setVisible(false)
      );
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree1)
      );

      await controller.connect(jwtProvider);

      initiateHandshakeOnStream(stream);
      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      const getTree2 = createGetTreeResponse(10, 100, (node) =>
        node.setVisible(false)
      );
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree2)
      );

      const newJwt = signJwt(random.guid());
      await controller.connect(() => newJwt);
      initiateHandshakeOnStream(stream);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({ type: 'disconnected' }),
        })
      );
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: [
            ...fromNodeProto(0, getTree2.getItemsList(), []),
            ...new Array(90),
          ],
          totalRows: 100,
          connection: expect.objectContaining({ type: 'connected' }),
        })
      );
    });

    it('clears row state if scene views are different', async () => {
      const { controller, client } = createController(10);
      const getTree = createGetTreeResponse(10, 100, (node) =>
        node.setVisible(false)
      );
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      await controller.connect(jwtProvider);

      onStateChange.mockClear();
      const newJwt = signJwt(random.guid());
      await controller.connect(() => newJwt);

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({ type: 'disconnected' }),
          rows: [],
        })
      );
    });

    it('emits failure if connect failed', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryError(new Error('oops'))
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      await expect(controller.connect(jwtProvider)).rejects.toThrowError();

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({
            type: 'failure',
          }),
        })
      );
    });

    it('does not throw an error if the controller is cancelled before a connection completes', async () => {
      const { controller, client } = createController(10);
      const getTree = createGetTreeResponse(10, 100, (node) =>
        node.setVisible(false)
      );
      (client.getTree as jest.Mock).mockImplementation(async (...args) => {
        await new Promise((resolve) => setTimeout(resolve, 25));
        mockGrpcUnaryResult(getTree)(...args);
      });

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      const connectPromise = controller.connect(jwtProvider);
      controller.cancel();

      await expect(connectPromise).resolves.not.toThrow();

      expect(onStateChange).not.toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({
            type: 'failure',
          }),
        })
      );
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({
            type: 'cancelled',
          }),
        })
      );
    });

    it('includes unauthorized in error details', async () => {
      const { controller, client } = createController(10);
      const error = { code: grpc.Code.Unauthenticated, metadata: {} };
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryError(error)
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      await expect(controller.connect(jwtProvider)).rejects.toMatchObject(
        error
      );

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({
            type: 'failure',
            details: new SceneTreeErrorDetails(
              'UNAUTHORIZED',
              SceneTreeErrorCode.UNAUTHORIZED
            ),
          }),
        })
      );
    });

    it('emits subscription failure if no handshake is received within the timeout', async () => {
      const subscriptionHandshakeTimeout = 50;
      const { controller, client, stream } = createController(
        10,
        subscriptionHandshakeTimeout
      );
      const getTree = createGetTreeResponse(10, 100, (node) =>
        node.setVisible(false)
      );
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      await controller.connect(jwtProvider);

      await new Promise((resolve) => {
        setTimeout(resolve, subscriptionHandshakeTimeout * 3 + 50);
      });

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({
            type: 'failure',
            details: new SceneTreeErrorDetails(
              'SUBSCRIPTION_FAILURE',
              SceneTreeErrorCode.SUBSCRIPTION_FAILURE
            ),
          }),
        })
      );
    });

    it('handles the subscription handshake', async () => {
      const subscriptionHandshakeTimeout = 50;
      const { controller, client, stream } = createController(
        10,
        subscriptionHandshakeTimeout
      );
      const getTree = createGetTreeResponse(10, 100, (node) =>
        node.setVisible(false)
      );
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(getTree)
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      await controller.connect(jwtProvider);

      const resp = new SubscribeResponse();
      resp.setHandshake(new Handshake());

      stream.invokeOnData(resp);

      await new Promise((resolve) => {
        setTimeout(resolve, subscriptionHandshakeTimeout + 50);
      });

      expect(onStateChange).not.toHaveBeenCalledWith(
        expect.objectContaining({
          connection: expect.objectContaining({
            type: 'failure',
            details: new SceneTreeErrorDetails(
              'SUBSCRIPTION_FAILURE',
              SceneTreeErrorCode.SUBSCRIPTION_FAILURE
            ),
          }),
        })
      );
    });
  });

  describe('subscription', () => {
    it('subscribes to remote changes', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);

      const req = new SubscribeRequest();
      expect(client.subscribe).toHaveBeenCalledWith(req, metadata);
    });

    it('should invalidate the tree on subscription failures', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );
      const stream = new ResponseStreamMock<SubscribeResponse>();

      (client.subscribe as jest.Mock).mockReturnValue(stream);

      await controller.connect(jwtProvider);

      stream.invokeOnStatus({
        code: 1,
        details: 'Testing',
      } as unknown as Status);

      const req = new SubscribeRequest();
      expect(client.subscribe).toHaveBeenCalledWith(req, metadata);

      const pages = Array.from({ length: 10 })
        .map((_, page) => page)
        .filter((page) => controller.isPageLoaded(page));

      expect(pages).toEqual([]);
    });

    it('should invalidate the tree when the subscription call ends', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );
      const stream = new ResponseStreamMock<SubscribeResponse>();

      (client.subscribe as jest.Mock).mockReturnValue(stream);

      await controller.connect(jwtProvider);

      stream.invokeOnEnd({
        code: 0,
        details: 'Testing',
      } as unknown as Status);

      const req = new SubscribeRequest();
      expect(client.subscribe).toHaveBeenCalledWith(req, metadata);

      const pages = Array.from({ length: 10 })
        .map((_, page) => page)
        .filter((page) => controller.isPageLoaded(page));

      expect(pages).toEqual([]);
    });

    it('cancels subscription when disconnected', async () => {
      const { controller, stream, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const cancel = jest.spyOn(stream, 'cancel');

      await controller.connect(jwtProvider);
      initiateHandshakeOnStream(stream);

      controller.disconnect();
      expect(cancel).toHaveBeenCalled();
    });

    it('resubscribes on server termination', async () => {
      const { controller, client, stream } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );
      await controller.connect(jwtProvider);

      initiateHandshakeOnStream(stream);
      stream.invokeOnEnd();
      await Async.delay(50);

      expect(client.subscribe).toHaveBeenCalledTimes(2);
    });

    it('fetches page when list changes', async () => {
      const { controller, client, stream } = createController(10);

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 20))
      );

      await controller.connect(jwtProvider);
      await controller.fetchPage(1);
      await controller.updateActiveRowRange(0, 9);

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      const listChange = new ListChange();
      listChange.setStart(0);
      const changeType = new TreeChangeType();
      changeType.setListChange(listChange);
      const resp = new SubscribeResponse();
      resp.setChange(changeType);
      stream.invokeOnData(resp);

      await Async.delay(25);
      await Promise.all([
        controller.getPage(0)?.res,
        controller.getPage(1)?.res,
      ]);

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          totalRows: 20,
        })
      );
    });

    it('patches data that has been hidden', async () => {
      const { controller, client, stream } = createController(100);

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createGetTreeResponse(100, 100, (node) => {
            node.setVisible(true);
            node.setPartiallyVisible(true);
          })
        )
      );

      await controller.connect(jwtProvider);

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
        {
          ...rows[0],
          node: { ...rows[0]?.node, visible: false, partiallyVisible: false },
        },
        {
          ...rows[1],
          node: { ...rows[1]?.node, visible: false, partiallyVisible: false },
        },
        {
          ...rows[2],
          node: { ...rows[2]?.node, visible: true, partiallyVisible: true },
        },
      ]);
    });

    it('patches data that has been shown', async () => {
      const { controller, client, stream } = createController(100);

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createGetTreeResponse(100, 100, (node) => {
            node.setVisible(false);
            node.setPartiallyVisible(true);
          })
        )
      );

      await controller.connect(jwtProvider);

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
        {
          ...rows[0],
          node: { ...rows[0]?.node, visible: true, partiallyVisible: false },
        },
        {
          ...rows[1],
          node: { ...rows[1]?.node, visible: true, partiallyVisible: false },
        },
        {
          ...rows[2],
          node: { ...rows[2]?.node, visible: false, partiallyVisible: true },
        },
      ]);
    });

    it('patches data that is partially visible', async () => {
      const { controller, client, stream } = createController(100);

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createGetTreeResponse(100, 100, (node) => {
            node.setPartiallyVisible(false);
          })
        )
      );

      await controller.connect(jwtProvider);

      const pendingRows = new Promise<Row[]>((resolve) => {
        controller.onStateChange.on((state) => {
          resolve(state.rows);
        });
      });

      const range = new Range();
      range.setStart(0);
      range.setEnd(1);
      const stateChange = new StateChange();
      stateChange.setPartiallyVisibleList([range]);
      const changeType = new TreeChangeType();
      changeType.setRanges(stateChange);
      const resp = new SubscribeResponse();
      resp.setChange(changeType);
      stream.invokeOnData(resp);

      const rows = await pendingRows;

      expect(rows.slice(0, 3)).toMatchObject([
        { ...rows[0], node: { ...rows[0]?.node, partiallyVisible: true } },
        { ...rows[1], node: { ...rows[1]?.node, partiallyVisible: true } },
        { ...rows[2], node: { ...rows[2]?.node, partiallyVisible: false } },
      ]);
    });

    it('patches data that has been selected', async () => {
      const { controller, client, stream } = createController(100);

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createGetTreeResponse(100, 100, (node) => node.setSelected(false))
        )
      );

      await controller.connect(jwtProvider);

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
        { ...rows[0], node: { ...rows[0]?.node, selected: true } },
        { ...rows[1], node: { ...rows[1]?.node, selected: true } },
        { ...rows[2], node: { ...rows[2]?.node, selected: false } },
      ]);
    });

    it('patches data that has been deselected', async () => {
      const { controller, client, stream } = createController(100);

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createGetTreeResponse(100, 100, (node) => node.setSelected(true))
        )
      );

      await controller.connect(jwtProvider);

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
        { ...rows[0], node: { ...rows[0]?.node, selected: false } },
        { ...rows[1], node: { ...rows[1]?.node, selected: false } },
        { ...rows[2], node: { ...rows[2]?.node, selected: true } },
      ]);
    });
  });

  describe(SceneTreeController.prototype.collapseNode, () => {
    it('makes call to collapse node', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(100, 100))
      );
      (client.collapseNode as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(new CollapseNodeResponse())
      );
      await controller.connect(jwtProvider);

      const nodeId = new Uuid();
      nodeId.setHex(random.guid());

      const req = new CollapseNodeRequest();
      req.setNodeId(nodeId);

      await controller.collapseNode(nodeId.getHex());
      expect(client.collapseNode).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });

    it('throws if grpc call errors', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(100, 100))
      );
      (client.collapseNode as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryError(new Error('oops'))
      );
      await controller.connect(jwtProvider);

      return expect(
        controller.collapseNode(random.guid())
      ).rejects.toThrowError();
    });

    it('throws if grpc error and result are null', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(100, 100))
      );
      (client.collapseNode as jest.Mock).mockImplementationOnce(
        (_, __, handler) => handler(null, null)
      );
      await controller.connect(jwtProvider);

      return expect(
        controller.collapseNode(random.guid())
      ).rejects.toThrowError();
    });
  });

  describe(SceneTreeController.prototype.expandNode, () => {
    it('makes call to expand node', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(100, 100))
      );
      (client.expandNode as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(new ExpandNodeResponse())
      );
      await controller.connect(jwtProvider);

      const nodeId = new Uuid();
      nodeId.setHex(random.guid());

      const req = new ExpandNodeRequest();
      req.setNodeId(nodeId);

      await controller.expandNode(nodeId.getHex());
      expect(client.expandNode).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.expandAll, () => {
    it('makes call to expand all nodes', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(100, 100))
      );
      (client.expandAll as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(new ExpandAllResponse())
      );
      await controller.connect(jwtProvider);

      const req = new ExpandAllRequest();
      await controller.expandAll();
      expect(client.expandAll).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.collapseAll, () => {
    it('makes call to collapse all nodes', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(100, 100))
      );
      (client.collapseAll as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(new CollapseAllResponse())
      );
      await controller.connect(jwtProvider);

      const req = new CollapseAllRequest();
      await controller.collapseAll();
      expect(client.collapseAll).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.fetchPage, () => {
    it('does nothing if index is outside bounds', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(100, 100))
      );
      await controller.connect(jwtProvider);

      await controller.fetchPage(-1);
      await controller.fetchPage(1);
      expect(client.getTree).toHaveBeenCalledTimes(1);
    });

    it('does nothing if page exists at index', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(1, 1))
      );

      await controller.connect(jwtProvider);
      await controller.fetchPage(0);

      expect(client.getTree).toHaveBeenCalledTimes(1);
    });

    it('fetches page with correct offset', async () => {
      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(1, 1))
      );
      await controller.connect(jwtProvider);

      const pager = new OffsetPager();
      pager.setOffset(0);
      pager.setLimit(100);

      const req = new GetTreeRequest();
      req.setPager(pager);

      expect(client.getTree).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
    });

    it('state change contains fetched rows and total count', async () => {
      const { controller, client } = createController(10);

      const getTree1 = createGetTreeResponse(10, 100);
      const getTree2 = createGetTreeResponse(10, 100);

      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(getTree1)
      );
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(getTree2)
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      await controller.connect(jwtProvider);

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: [
            ...fromNodeProto(0, getTree1.getItemsList(), []),
            ...new Array(90),
          ],
          totalRows: 100,
        })
      );

      await controller.fetchPage(1);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: [
            ...fromNodeProto(0, getTree1.getItemsList(), []),
            ...fromNodeProto(10, getTree2.getItemsList(), []),
            ...new Array(80),
          ],
          totalRows: 100,
        })
      );
    });

    it('marks page as not loaded if request fails', async () => {
      const error: ServiceError = {
        code: grpc.Code.FailedPrecondition,
        metadata: new grpc.Metadata({}),
        message: 'Failed',
      };

      const { controller, client } = createController(100);
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryError(error)
      );

      await expect(controller.connect(jwtProvider)).rejects.toMatchObject({
        code: grpc.Code.FailedPrecondition,
      });

      expect(controller.isPageLoaded(0)).toBe(false);
    });
  });

  describe(SceneTreeController.prototype.fetchPageAtOffset, () => {
    it('does nothing if index is outside bounds', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);

      await controller.fetchPageAtOffset(-1);
      await controller.fetchPageAtOffset(100);

      expect(client.getTree).toHaveBeenCalledTimes(1);
    });

    it('fetches the correct page from given offset', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);

      await controller.fetchPageAtOffset(10);

      const pager = new OffsetPager();
      pager.setOffset(10);
      pager.setLimit(10);

      const req = new GetTreeRequest();
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
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);

      await controller.fetchRange(-1, 101);

      const pager1 = new OffsetPager();
      pager1.setOffset(0);
      pager1.setLimit(10);

      const pager2 = new OffsetPager();
      pager2.setOffset(90);
      pager2.setLimit(10);

      const req1 = new GetTreeRequest();
      req1.setPager(pager1);

      const req2 = new GetTreeRequest();
      req2.setPager(pager2);

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
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);
      (client.getTree as jest.Mock).mockClear();

      await controller.fetchRange(0, 100);

      // skips first page because its already been fetched
      expect(client.getTree).toHaveBeenCalledTimes(9);
    });
  });

  describe(SceneTreeController.prototype.filter, () => {
    const term = 'filter';

    it('defaults to including full tree and non-exact match', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const filterRes = new FilterResponse();
      filterRes.setNumberOfResults(5);
      (client.filter as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(filterRes)
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);
      await controller.connect(jwtProvider);

      const req = new FilterRequest();
      req.setFilter(term);
      req.setFullTree(true);
      req.setExactMatch(false);

      await controller.filter(term);

      expect(client.filter).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          totalFilteredRows: 5,
        })
      );
    });

    it('does not filter whole tree when include collapsed is false', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );
      const filterRes = new FilterResponse();
      filterRes.setNumberOfResults(5);
      (client.filter as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(filterRes)
      );

      await controller.connect(jwtProvider);

      const req = new FilterRequest();
      req.setFilter(term);
      req.setFullTree(false);
      req.setExactMatch(true);

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);
      await controller.filter(term, {
        includeCollapsed: false,
        exactMatch: true,
      });

      expect(client.filter).toHaveBeenCalledWith(
        req,
        metadata,
        expect.anything()
      );
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          totalFilteredRows: 5,
        })
      );
    });
  });

  describe(SceneTreeController.prototype.getNonLoadedPageIndexes, () => {
    it('returns page indices for pages that have been fetched', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);
      await controller.fetchPage(1);

      const pages = controller.getNonLoadedPageIndexes(0, 100);
      expect(pages).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe(SceneTreeController.prototype.invalidatePagesOutsideRange, () => {
    it('removes pages that are furthest from start and end range', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);
      await controller.fetchRange(0, 100);

      controller.invalidatePagesOutsideRange(4, 5, 4);

      const pages = Array.from({ length: 10 })
        .map((_, page) => page)
        .filter((page) => controller.isPageLoaded(page));

      expect(pages).toEqual([3, 4, 5, 6]);
    });

    it('does nothing if threshold is not met', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);
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
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);
      await controller.fetchRange(0, 100);

      const page = controller.getPageForOffset(101);
      expect(page).toBe(9);
    });
  });

  describe(SceneTreeController.prototype.getPageIndexesForRange, () => {
    it('constrains ranges', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);
      await controller.fetchRange(0, 100);

      const range = controller.getPageIndexesForRange(-1, 101);
      expect(range).toEqual([0, 9]);
    });
  });

  describe(SceneTreeController.prototype.expandParentNodes, () => {
    it('reloads tree if call responds with require reload', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      const index = new UInt64Value();
      index.setValue(0);
      const locateRes = new LocateItemResponse();
      locateRes.setLocatedIndex(index);
      locateRes.setRequiresReload(true);

      (client.locateItem as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(locateRes)
      );

      await controller.connect(jwtProvider);
      controller.updateActiveRowRange(0, 9);

      (client.getTree as jest.Mock).mockClear();
      await controller.expandParentNodes('node-id');

      const page1 = new OffsetPager();
      page1.setOffset(0);
      page1.setLimit(10);
      const expectedReq1 = new GetTreeRequest();
      expectedReq1.setPager(page1);

      const page2 = new OffsetPager();
      page2.setOffset(10);
      page2.setLimit(10);
      const expectedReq2 = new GetTreeRequest();
      expectedReq2.setPager(page2);

      expect(client.getTree).toHaveBeenCalledWith(
        expectedReq1,
        expect.anything(),
        expect.anything()
      );
      expect(client.getTree).toHaveBeenCalledWith(
        expectedReq2,
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe(SceneTreeController.prototype.updateActiveRowRange, () => {
    it('fetches pages in active rows that have not been fetched', async () => {
      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);

      const pendingRows = new Promise<Row[]>((resolve) => {
        controller.onStateChange.on((state) => {
          if (state.rows.slice(0, 20).every((row) => row != null)) {
            resolve(state.rows);
          }
        });
      });

      controller.updateActiveRowRange(0, 9);
      controller.updateActiveRowRange(10, 19);

      const rows = await pendingRows;

      expect(rows.slice(0, 20).every((row) => row != null)).toBe(true);
    });
  });

  describe(SceneTreeController.prototype.fetchMetadataKeys, () => {
    it('returns column keys', async () => {
      const key1 = new ColumnKey();
      key1.setValue('key1');
      const key2 = new ColumnKey();
      key2.setValue('key2');
      const columnRes = new GetAvailableColumnsResponse();
      columnRes.setKeysList([key1, key2]);

      const { controller, client } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );
      (client.getAvailableColumns as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(columnRes)
      );

      await controller.connect(jwtProvider);

      const res = await controller.fetchMetadataKeys();
      expect(res).toEqual(['key1', 'key2']);
    });
  });

  describe(SceneTreeController.prototype.setMetadataKeys, () => {
    it('refetches pages in active rows with additional metadata values', async () => {
      const { controller, client, stream } = createController(10);
      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(createGetTreeResponse(10, 100))
      );

      await controller.connect(jwtProvider);
      initiateHandshakeOnStream(stream);
      await controller.updateActiveRowRange(0, 9);

      const pendingRows = new Promise<Row[]>((resolve) => {
        controller.onStateChange.on((state) => resolve(state.rows));
      });

      (client.getTree as jest.Mock).mockImplementation(
        mockGrpcUnaryResult(
          createGetTreeResponse(10, 100, (node) => {
            node.setColumnsList(['val1', 'val2']);
          })
        )
      );
      await controller.setMetadataKeys(['key1', 'key2']);

      const rows = await pendingRows;
      expect(
        rows
          .slice(0, 10)
          .every(
            (row) =>
              row?.metadata.key1 === 'val1' && row.metadata.key2 === 'val2'
          )
      ).toBe(true);
    });
  });
});
