import { grpc } from '@improbable-eng/grpc-web';
import { OffsetPager } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import {
  CollapseAllRequest,
  CollapseNodeRequest,
  ExpandAllRequest,
  ExpandNodeRequest,
  FilterRequest,
  FilterResponse,
  GetAvailableColumnsRequest,
  GetAvailableColumnsResponse,
  GetNodeAncestorsRequest,
  GetNodeAncestorsResponse,
  GetTreeRequest,
  GetTreeResponse,
  LocateItemRequest,
  LocateItemResponse,
  SubscribeRequest,
  SubscribeResponse,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import {
  ResponseStream,
  SceneTreeAPIClient,
  ServiceError,
  UnaryResponse,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { Disposable, EventDispatcher, Listener } from '@vertexvis/utils';

import { MetadataKey } from '../types';
import {
  SceneTreeConnectionCancelledError,
  SceneTreeError,
  SceneTreeErrorCode,
  SceneTreeErrorDetails,
  SceneTreeOperationFailedError,
  SceneTreeUnauthorizedError,
} from './errors';
import { isGrpcServiceError } from './grpc';
import { decodeSceneTreeJwt } from './jwt';
import { fromNodeProto, isLoadedRow, Row } from './row';

export interface ConnectOptions {
  spinnerDelay: number;
  idleReconnectInSeconds?: number;
  lostConnectionReconnectInSeconds?: number;
  subscriptionHandshakeGracePeriodInMs?: number;
}

export type JwtProvider = () => string | undefined;

export interface SceneTreeState {
  totalRows: number;
  totalFilteredRows?: number;
  rows: Row[];
  connection: ConnectionState;
  isSearching: boolean;
  shouldShowLoading?: boolean;
  shouldShowEmptyResults?: boolean;
  filterTerm?: string;
  handshakeReceived?: boolean;
  firstFetchComplete?: boolean;
}

interface Page {
  id: number;
  index: number;
  metadataKeys: MetadataKey[];
  res: Promise<GetTreeResponse>;
}

export interface DisconnectedState {
  type: 'disconnected';
  jwtProvider?: JwtProvider;
  sceneViewId?: string;
}

export interface ConnectingState {
  type: 'connecting';
  jwtProvider: JwtProvider;
  sceneViewId: string;
}

export interface SubscriptionStatusState {
  attempt: number;
  stream: ResponseStream<SubscribeResponse>;
}

export interface ConnectedState {
  type: 'connected';
  jwtProvider: JwtProvider;
  sceneViewId: string;
  subscription: Disposable;
  subscriptionStatusState?: SubscriptionStatusState;
}

export interface ConnectionFailedState {
  type: 'failure';
  details: SceneTreeErrorDetails;
  jwtProvider: JwtProvider;
  sceneViewId: string;
}

export interface ConnectionCancelledState {
  type: 'cancelled';
  jwtProvider?: JwtProvider;
  sceneViewId?: string;
}

/**
 * A set of options to configure tree filtering behavior.
 */
export interface FilterTreeOptions {
  /**
   * Indicates if the filter should include nodes that within collapsed parent
   * nodes.
   */
  includeCollapsed?: boolean;

  /**
   * Indicates if the filter should be an exact match with the results.
   */
  exactMatch?: boolean;

  /**
   * The metadata keys to filter the tree on.
   */
  columns?: MetadataKey[];
}

type ConnectionState =
  | DisconnectedState
  | ConnectingState
  | ConnectedState
  | ConnectionFailedState
  | ConnectionCancelledState;

/**
 * The `SceneTreeController` is responsible for coordinating interactions of the
 * view, fetching and mutating tree data on the server, maintaining state and
 * notifying the view about state changes.
 */
export class SceneTreeController {
  private static IDLE_RECONNECT_IN_SECONDS = 4 * 60;
  private static LOST_CONNECTION_RECONNECT_IN_SECONDS = 2;
  private static MAX_SUBSCRIPTION_RETRY_COUNT = 2;

  private nextPageId = 0;
  private pages = new Map<number, Page>();
  private activeRowRange = [0, 0];
  private metadataKeys: MetadataKey[] = [];
  private debugLogs = false;
  private pendingFilterGrpcRes?: UnaryResponse;

  private reconnectTimer?: number;
  private loadingTimer?: number;
  private subscriptionHandshakeTimer?: number;

  /**
   * A dispatcher that emits an event whenever the internal state has changed.
   */
  public onStateChange = new EventDispatcher<SceneTreeState>();

  private state: SceneTreeState = {
    totalRows: 0,
    isSearching: false,
    rows: [],
    connection: { type: 'disconnected' },
  };

  /**
   * The number of pages that have been fetched.
   */
  public get fetchedPageCount(): number {
    return this.pages.size;
  }

  /**
   * Indicates if the controller is connected to the tree backend, and can make
   * requests.
   */
  public get isConnected(): boolean {
    return this.state.connection.type === 'connected';
  }

  public constructor(
    private client: SceneTreeAPIClient,
    private rowLimit: number,
    private connectOptions: ConnectOptions = {
      spinnerDelay: 2000,
      subscriptionHandshakeGracePeriodInMs: 5000,
    }
  ) {}

  /**
   * Registers an event listener that will be invoked when the state changes
   *
   * @param listener The listener to add.
   * @returns A disposable that can be used to remove the listener.
   */
  public stateChanged(
    listener: Listener<SceneTreeState | undefined>
  ): Disposable {
    return this.onStateChange.on(listener);
  }

  public setDebugLogs(debugLogs: boolean): void {
    this.debugLogs = debugLogs;
  }

  private async handleSubscriptionHandshakeTimeout(
    jwtProvider: JwtProvider,
    sceneViewId: string
  ): Promise<void> {
    const connection = this.getState().connection;
    if (
      this.isConnectedState(connection) &&
      connection.subscriptionStatusState?.attempt != null &&
      connection.subscriptionStatusState.attempt <
        SceneTreeController.MAX_SUBSCRIPTION_RETRY_COUNT
    ) {
      const newAttempt = connection.subscriptionStatusState.attempt + 1;
      console.warn(
        `Failed to subscribe within the allotted timeout. Retry attempt={${newAttempt}}`
      );
      connection.subscriptionStatusState.stream.cancel();
      this.clearHandshakeTimer();

      const stream = await this.subscribe();

      this.invalidateAfterOffset(0);
      this.fetchUnloadedPagesInActiveRows();

      this.updateState({
        ...this.state,
        connection: {
          ...connection,
          type: 'connected',
          subscription: {
            dispose: () => stream.cancel(),
          },
          subscriptionStatusState: {
            attempt: newAttempt,
            stream,
          },
        },
      });

      this.subscriptionHandshakeTimer = window.setTimeout(() => {
        this.handleSubscriptionHandshakeTimeout(jwtProvider, sceneViewId);
      }, this.connectOptions.subscriptionHandshakeGracePeriodInMs);
    } else {
      this.updateState({
        ...this.state,
        connection: {
          type: 'failure',
          jwtProvider,
          sceneViewId,
          details: new SceneTreeErrorDetails(
            'SUBSCRIPTION_FAILURE',
            SceneTreeErrorCode.SUBSCRIPTION_FAILURE
          ),
        },
      });
    }
  }

  public async connect(jwtProvider: JwtProvider): Promise<void> {
    const { connection } = this.state;
    const jwt = jwtProvider();

    if (jwt == null) {
      throw new SceneTreeUnauthorizedError(
        'Cannot connect scene tree. JWT is undefined'
      );
    }

    const { view: sceneViewId } = decodeSceneTreeJwt(jwt);

    if (connection.sceneViewId !== sceneViewId) {
      this.disconnect(true);
    } else {
      this.disconnect(false);
    }

    const connecting: ConnectingState = {
      type: 'connecting',
      jwtProvider,
      sceneViewId,
    };
    this.updateState({ ...this.state, connection: connecting });

    try {
      this.log('Scene tree controller connecting.');

      this.restartLoadingTimer();
      // Ensure we have a subscription prior to attempting to get the first page
      // to make sure we receive any ListChange that comes through
      const stream = await this.subscribe();
      await this.fetchPage(0);

      if (this.state.connection.type !== 'cancelled') {
        this.updateState({
          ...this.state,
          connection: {
            jwtProvider,
            sceneViewId,
            type: 'connected',
            subscription: { dispose: () => stream.cancel() },
            subscriptionStatusState: {
              attempt: 0,
              stream,
            },
          },
        });

        this.restartHandshakeTimer(jwtProvider, sceneViewId);
      }
    } catch (e) {
      this.ifErrorIsFatal(e, () => {
        this.updateState({
          ...this.state,
          connection: {
            type: 'failure',
            jwtProvider,
            sceneViewId,
            details: this.getConnectionError(e),
          },
        });
        this.clearHandshakeTimer();
        throw e;
      });
    }

    this.startIdleReconnectTimer();
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer != null) {
      window.clearTimeout(this.reconnectTimer);
    }
  }

  private restartHandshakeTimer(
    jwtProvider: JwtProvider,
    sceneViewId: string
  ): void {
    this.clearHandshakeTimer();

    if (!this.state.handshakeReceived) {
      this.subscriptionHandshakeTimer = window.setTimeout(() => {
        this.handleSubscriptionHandshakeTimeout(jwtProvider, sceneViewId);
        this.subscriptionHandshakeTimer = undefined;
      }, this.connectOptions.subscriptionHandshakeGracePeriodInMs);
    }
  }

  private clearHandshakeTimer(): void {
    if (this.subscriptionHandshakeTimer != null) {
      window.clearTimeout(this.subscriptionHandshakeTimer);
      this.subscriptionHandshakeTimer = undefined;
    }
  }

  private startIdleReconnectTimer(): void {
    this.startReconnectTimer(
      this.connectOptions.idleReconnectInSeconds ||
        SceneTreeController.IDLE_RECONNECT_IN_SECONDS
    );
  }

  private startConnectionLostReconnectTimer(): void {
    this.startReconnectTimer(
      this.connectOptions.lostConnectionReconnectInSeconds ||
        SceneTreeController.LOST_CONNECTION_RECONNECT_IN_SECONDS
    );
  }

  private startReconnectTimer(delayInSeconds: number): void {
    this.clearReconnectTimer();

    this.reconnectTimer = window.setTimeout(() => {
      if (this.state.connection.type === 'connected') {
        this.connect(this.state.connection.jwtProvider);
      }
    }, delayInSeconds * 1000);
  }

  public connectToViewer(viewer: HTMLVertexViewerElement): Disposable {
    const connectWithViewerJwt = async (): Promise<void> => {
      if (viewer.token != null) {
        this.log(
          'Scene tree controller found viewer JWT. Attempting connection.'
        );

        try {
          await this.connect(() => viewer.token);
        } catch (e) {
          this.ifErrorIsFatal(e, () => {
            console.error('Scene tree controller errored connecting.', e);
          });
        }
      }
    };

    const handleSceneReady = (): void => {
      this.log('Scene tree controller received scene ready');
      connectWithViewerJwt();
    };

    connectWithViewerJwt();

    viewer.addEventListener('sceneReady', handleSceneReady);
    return {
      dispose: () => {
        viewer.removeEventListener('sceneReady', handleSceneReady);
        this.disconnect();
      },
    };
  }

  public disconnect(reset = false): void {
    this.log(`Scene tree controller disconnecting [reset=${reset}]`);

    this.clearHandshakeTimer();
    this.clearReconnectTimer();

    if (reset) {
      this.pages.clear();
      this.activeRowRange = [];
    }

    const { connection } = this.state;
    if (connection.type === 'connected') {
      connection.subscription.dispose();
    }

    this.updateState({
      connection: {
        type: 'disconnected',
        jwtProvider: connection.jwtProvider,
        sceneViewId: connection.sceneViewId,
      },
      isSearching: false,
      totalRows: reset ? 0 : this.state.totalRows,
      rows: reset ? [] : this.state.rows,
      filterTerm: reset ? undefined : this.state.filterTerm,
      totalFilteredRows: reset ? undefined : this.state.totalFilteredRows,
      shouldShowEmptyResults: reset
        ? undefined
        : this.state.shouldShowEmptyResults,
      handshakeReceived: reset ? undefined : this.state.handshakeReceived,
      firstFetchComplete: reset ? undefined : this.state.firstFetchComplete,
    });
  }

  public cancel(): void {
    this.log(`Scene tree controller cancelled`);

    this.clearHandshakeTimer();
    this.clearReconnectTimer();

    this.pages.clear();
    this.activeRowRange = [];

    const { connection } = this.state;
    if (connection.type === 'connected') {
      connection.subscription.dispose();
    }

    this.updateState({
      connection: {
        type: 'cancelled',
        jwtProvider: connection.jwtProvider,
        sceneViewId: connection.sceneViewId,
      },
      isSearching: false,
      totalRows: 0,
      rows: [],
    });
  }

  /**
   * Collapses a node with the given node ID.
   *
   * @param id A node ID to collapse.
   */
  public async collapseNode(id: string): Promise<void> {
    return this.ifConnectionHasJwt(async (jwt) => {
      const nodeId = new Uuid();
      nodeId.setHex(id);

      const req = new CollapseNodeRequest();
      req.setNodeId(nodeId);

      await this.requestUnary(jwt, (metadata, handler) =>
        this.client.collapseNode(req, metadata, handler)
      );
    });
  }

  /**
   * Expands a node with the given node ID.
   *
   * @param id A node ID to expand.
   */
  public async expandNode(id: string): Promise<void> {
    return this.ifConnectionHasJwt(async (jwt) => {
      const nodeId = new Uuid();
      nodeId.setHex(id);

      const req = new ExpandNodeRequest();
      req.setNodeId(nodeId);

      await this.requestUnary(jwt, (metadata, handler) =>
        this.client.expandNode(req, metadata, handler)
      );
    });
  }

  /**
   * Collapses all nodes in the tree.
   */
  public async collapseAll(): Promise<void> {
    return this.ifConnectionHasJwt(async (jwt) => {
      await this.requestUnary(jwt, (metadata, handler) =>
        this.client.collapseAll(new CollapseAllRequest(), metadata, handler)
      );
    });
  }

  /**
   * Expands all nodes in the tree.
   */
  public async expandAll(): Promise<void> {
    return this.ifConnectionHasJwt(async (jwt) => {
      await this.requestUnary(jwt, (metadata, handler) =>
        this.client.expandAll(new ExpandAllRequest(), metadata, handler)
      );
    });
  }

  /**
   * Invokes a network request that will expand all the parent nodes for the
   * node mapped to the given ID.
   *
   * @param id An ID of an item.
   * @returns A promise that resolves with the index of the node after
   *  expansion.
   */
  public async expandParentNodes(id: string): Promise<number> {
    return this.ifConnectionHasJwt(async (jwt) => {
      const nodeId = new Uuid();
      nodeId.setHex(id);

      const req = new LocateItemRequest();
      req.setNodeId(nodeId);

      const res = await this.requestUnary<LocateItemResponse>(
        jwt,
        (metadata, handler) => this.client.locateItem(req, metadata, handler)
      );
      const { requiresReload, locatedIndex } = res.toObject();

      if (requiresReload) {
        this.invalidateAfterOffset(0);
        await this.fetchUnloadedPagesInActiveRows();
      }

      if (locatedIndex == null) {
        throw new SceneTreeOperationFailedError(
          'Cannot locate node. Location index is undefined.'
        );
      }

      return locatedIndex.value;
    });
  }

  public async fetchNodeAncestors(nodeId: string): Promise<Node.AsObject[]> {
    return this.ifConnectionHasJwt(async (jwt) => {
      const nodeUuid = new Uuid();
      nodeUuid.setHex(nodeId);
      const req = new GetNodeAncestorsRequest();
      req.setNodeId(nodeUuid);

      const res = await this.requestUnary<GetNodeAncestorsResponse>(
        jwt,
        (metadata, handler) =>
          this.client.getNodeAncestors(req, metadata, handler)
      );

      return res.toObject().itemsList;
    });
  }

  /**
   * Fetches a page at the given index. Once the data has been fetched, the
   * controller will emit an `onStateChange` event that contains rows with the
   * fetched page. If a page is invalidated before the request completes, the
   * response is ignored.
   *
   * If the index is out of range, returns without fetching any data.
   *
   * @param index A 0 based index to fetch.
   */
  public async fetchPage(index: number): Promise<void> {
    return this.ifConnectionHasJwt(async (jwt) => {
      if (index < 0 || index > this.maxPages - 1) {
        return;
      }

      if (!this.pages.has(index)) {
        const offset = index * this.rowLimit;
        this.log('Scene tree fetching page', index, offset);
        const res = this.fetchTree(offset, this.rowLimit, jwt);
        const id = this.nextPageId++;
        const page = { id, res, index, metadataKeys: this.metadataKeys };
        this.pages.set(index, page);
        this.handlePageResult(page);
      }

      await this.pages.get(index)?.res;
    });
  }

  /**
   * Fetches a page that contains the given row offset.
   *
   * @param offset The row offset of the page to fetch.
   */
  public fetchPageAtOffset(offset: number): Promise<void> {
    const page = Math.floor(offset / this.rowLimit);
    return this.fetchPage(page);
  }

  /**
   * Fetches pages that contain the given row ranges.
   *
   * @param startOffset A start offset, inclusive.
   * @param endOffset The end offset, inclusive.
   */
  public async fetchRange(
    startOffset: number,
    endOffset: number
  ): Promise<void> {
    const startPage = Math.floor(startOffset / this.rowLimit);
    const endPage = Math.floor(endOffset / this.rowLimit);
    const [boundedStart, boundedEnd] = this.constrainPageRange(
      startPage,
      endPage
    );
    const pageCount = boundedEnd - boundedStart + 1;
    await Promise.all(
      Array.from({ length: pageCount }).map((_, page) => this.fetchPage(page))
    );
  }

  /**
   * Fetches the metadata keys for the current scene view.
   */
  public async fetchMetadataKeys(): Promise<MetadataKey[]> {
    return this.ifConnectionHasJwt(async (jwt) => {
      const res = await this.requestUnary<GetAvailableColumnsResponse>(
        jwt,
        (meta, handler) => {
          const req = new GetAvailableColumnsRequest();
          this.client.getAvailableColumns(req, meta, handler);
        }
      );

      return res.getKeysList().map((value) => value.getValue());
    });
  }

  /**
   * Performs a network request that will filter the nodes in the tree that
   * match the given term and options.
   *
   * @param term The filter term.
   * @param options The options to apply to the filter.
   */
  public async filter(
    term: string,
    options: FilterTreeOptions = {}
  ): Promise<void> {
    return this.ifConnectionHasJwt(async (jwt) => {
      this.updateState({
        ...this.state,
        isSearching: true,
        filterTerm: term !== '' ? term : undefined,
      });

      // Cancel any in-flight filter requests, and wait for the request
      // to complete prior to making another filter request. This prevents
      // a race condition between requests from different keystrokes.
      this.pendingFilterGrpcRes?.cancel();
      this.pendingFilterGrpcRes = undefined;

      if (this.state.filterTerm === term || term === '') {
        try {
          const res = await this.requestUnary<FilterResponse>(
            jwt,
            (metadata, handler) => {
              const req = new FilterRequest();
              req.setFilter(term);
              req.setFullTree(options.includeCollapsed ?? true);
              req.setExactMatch(!!options.exactMatch);
              if (options.columns) req.setColumnsKeysList(options.columns);

              this.pendingFilterGrpcRes = this.client.filter(
                req,
                metadata,
                handler
              );
            }
          );

          const { numberOfResults } = res.toObject();

          this.updateState({
            ...this.state,
            totalFilteredRows: numberOfResults,
            isSearching: false,
          });
        } catch (e) {
          console.error('Failed to filter search ', e);
          this.updateState({
            ...this.state,
            isSearching: false,
          });
        }
      }
    });
  }

  /**
   * Checks if the page at the given index is loaded.
   *
   * @param index A page index.
   * @returns `true` if the page is loaded. `false` otherwise.
   */
  public isPageLoaded(index: number): boolean {
    return this.pages.has(index);
  }

  /**
   * Returns a list of page indices within a range that have not been loaded.
   *
   * @param start The start page index, inclusive.
   * @param end The end page index, inclusive.
   * @returns A list of pages indices that have not been loaded.
   */
  public getNonLoadedPageIndexes(start: number, end: number): number[] {
    const [boundedStart, boundedEnd] = this.constrainPageRange(start, end);
    const pageCount = boundedEnd - boundedStart + 1;
    return Array.from({ length: pageCount })
      .map((_, i) => boundedStart + i)
      .filter((page) => !this.isPageLoaded(page));
  }

  /**
   * Returns the page at the given index, or `undefined` if one doesn't exist.
   *
   * @param index The index to return.
   * @returns A `Page` if found, otherwise `undefined`.
   */
  public getPage(index: number): Page | undefined {
    return this.pages.get(index);
  }

  /**
   * Clears page data that is outside a given range. Uses a distance algorithm
   * to removes pages that are furthest from either end of the range. This
   * method is useful for clearing out data that is not needed anymore to keep
   * memory pressure in the client low.
   *
   * @param startPage The index of the starting page in the range.
   * @param endPage The index of the ending page in the range.
   * @param threshold A minimum number of pages to keep. No cleanup is performed
   *  if the number of fetched pages doesn't meet this threshold.
   */
  public invalidatePagesOutsideRange(
    startPage: number,
    endPage: number,
    threshold = 0
  ): void {
    const [boundedStart, boundedEnd] = this.constrainPageRange(
      startPage,
      endPage
    );
    const boundedThreshold = Math.max(boundedEnd - boundedStart, threshold);
    if (this.fetchedPageCount > boundedThreshold) {
      const pages = Array.from(this.pages.keys()).map((index) => {
        const distance =
          index < boundedStart ? boundedStart - index : index - boundedEnd;
        return { index, distance };
      });
      const sortedDesc = pages.sort((a, b) => b.distance - a.distance);

      sortedDesc
        .slice(0, pages.length - threshold)
        .forEach(({ index }) => this.invalidatePage(index));

      this.log(
        `Scene tree dropped ${pages.length - this.fetchedPageCount} pages`,
        this.pages
      );
    }
  }

  public setMetadataKeys(keys: MetadataKey[]): Promise<void> {
    this.metadataKeys = keys;

    if (this.state.connection.type === 'connected') {
      const [start, end] = this.activeRowRange;
      this.invalidateAfterOffset(0);
      return this.updateActiveRowRange(start, end);
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Sets the active rows. Active rows dictate which pages will be refetched
   * when the tree changes.
   *
   * @param start The starting row index.
   * @param end The ending row index.
   * @returns A promise that resolves when the first page of data has been
   *  loaded.
   */
  public async updateActiveRowRange(start: number, end: number): Promise<void> {
    this.activeRowRange = this.constrainRowOffsets(start, end);

    this.tryClearLoadingState();

    await this.fetchUnloadedPagesInActiveRows();
  }

  /**
   * Performs a network request that will listen to server-side changes of the
   * scene tree's data.
   */
  private subscribe(): Promise<ResponseStream<SubscribeResponse>> {
    return this.ifConnectionHasJwt((jwt) => {
      const stream = this.requestServerStream(jwt, (metadata) => {
        const sub = this.client.subscribe(new SubscribeRequest(), metadata);
        return sub;
      });

      stream.on('data', (msg: SubscribeResponse) => {
        if (msg.hasHandshake()) {
          this.clearHandshakeTimer();
          this.updateState({ ...this.state, handshakeReceived: true });

          // Verify that we've loaded the first page of the tree when we receive
          // a handshake in the case that the listener was not fully registered
          // when a `ListChange` was sent.
          if (this.state.firstFetchComplete) {
            this.log(
              'Scene tree first fetch completed before handshake received, invalidating current pages'
            );

            this.invalidateAfterOffset(0);
            this.fetchUnloadedPagesInActiveRows();
          }
        }

        this.startIdleReconnectTimer();

        const { change } = msg.toObject();

        if (change?.listChange != null) {
          this.log('Received list change', change.listChange.start);
          this.invalidateAfterOffset(change.listChange.start);
          this.fetchUnloadedPagesInActiveRows();
        }

        const {
          hiddenList = [],
          shownList = [],
          partiallyVisibleList = [],
          deselectedList = [],
          selectedList = [],
        } = change?.ranges || {};

        if (partiallyVisibleList.length > 0) {
          this.log(
            'Received partial visibility list change',
            partiallyVisibleList
          );

          partiallyVisibleList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({
              partiallyVisible: true,
            }))
          );
        }

        if (hiddenList.length > 0) {
          this.log('Received hidden list change', hiddenList);

          hiddenList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({
              visible: false,
              partiallyVisible: false,
            }))
          );
        }

        if (shownList.length > 0) {
          this.log('Received shown list change', shownList);

          shownList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({
              visible: true,
              partiallyVisible: false,
            }))
          );
        }

        if (deselectedList.length > 0) {
          this.log('Received deselected list change', deselectedList);

          deselectedList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({ selected: false }))
          );
        }

        if (selectedList.length > 0) {
          this.log('Received selected list change', selectedList);

          selectedList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({ selected: true }))
          );
        }
      });

      stream.on('status', (s) => {
        if (s.code !== 0) {
          console.error(
            `Failed to subscribe to scene tree with code=${s.code}, details=${s.details}`
          );
          this.invalidateAfterOffset(0);
        }
      });

      stream.on('end', () => {
        this.invalidateAfterOffset(0);

        if (this.state.connection.type === 'connected') {
          this.startConnectionLostReconnectTimer();
        }
      });

      return stream;
    });
  }

  private async fetchUnloadedPagesInActiveRows(): Promise<void> {
    const [startPage, endPage] = this.getPageIndexesForRange(
      // Verify the first page is loaded properly even if the `activeRowRange`
      // has not been specified by the underlying table layout after a reconnect.
      this.activeRowRange[0] ?? 0,
      this.activeRowRange[1] ?? 0
    );

    const pages = this.getNonLoadedPageIndexes(startPage - 1, endPage + 1);
    await Promise.all(pages.map((page) => this.fetchPage(page)));
  }

  private patchNodesInRange(
    start: number,
    end: number,
    transform: (node: Node.AsObject) => Partial<Node.AsObject>
  ): void {
    const updatedRows = this.state.rows
      .slice(start, end + 1)
      .map((row) =>
        isLoadedRow(row)
          ? { ...row, node: { ...row.node, ...transform(row.node) } }
          : row
      );

    const startRows = this.state.rows.slice(0, start);
    const endRows = this.state.rows.slice(end + 1);
    const rows = [...startRows, ...updatedRows, ...endRows];

    this.updateState({ ...this.state, rows });
  }

  private async handlePageResult(page: Page): Promise<void> {
    try {
      const res = await page.res;

      const currentPage = this.getPage(page.index);

      // Only handle the result if the page has not been invalidated.
      if (currentPage?.id === page.id) {
        const cursor = res.getCursor();
        const itemsList = res.getItemsList();

        const totalRows = cursor?.getTotal() ?? 0;
        const offset = page.index * this.rowLimit;
        const fetchedRows = fromNodeProto(
          offset,
          itemsList,
          currentPage.metadataKeys
        );

        const start = this.state.rows.slice(0, offset);
        const end = this.state.rows.slice(
          start.length + fetchedRows.length,
          totalRows
        );
        const fill = new Array(
          Math.max(
            0,
            totalRows - start.length - fetchedRows.length - end.length
          )
        );
        const rows = [...start, ...fetchedRows, ...end, ...fill];

        if (this.isViewLoading(rows) && this.loadingTimer == null) {
          this.restartLoadingTimer();

          this.updateState({
            ...this.state,
            totalRows: totalRows,
            rows: rows,
            shouldShowEmptyResults:
              this.state.filterTerm != null &&
              (rows.length === 0 || this.state.totalFilteredRows === 0),
          });
        } else {
          this.updateState({
            ...this.state,
            totalRows: totalRows,
            rows: rows,
            shouldShowLoading:
              rows.length === 0 && this.state.shouldShowLoading,
            shouldShowEmptyResults:
              this.state.filterTerm != null &&
              (rows.length === 0 || this.state.totalFilteredRows === 0),
            firstFetchComplete: true,
          });
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.toString() : 'Unknown';
      console.error(
        `Request error fetching page at index ${page.index} (${errorMessage})`
      );

      const currentPage = this.getPage(page.index);
      if (currentPage?.id === page.id) {
        this.invalidatePage(page.index);
      }
    }
  }

  private invalidatePage(index: number): void {
    if (this.isPageLoaded(index)) {
      this.pages.delete(index);
    }
  }

  private invalidateAfterOffset(offset: number): void {
    const pageIndex = Math.floor(offset / this.rowLimit);

    for (const index of this.pages.keys()) {
      if (index >= pageIndex) {
        this.invalidatePage(index);
      }
    }
  }

  private getState(): SceneTreeState {
    return this.state;
  }

  private isViewLoading(rows: Row[]): boolean {
    return (
      this.state.filterTerm == null &&
      rows[this.activeRowRange[0]] == null &&
      rows[this.activeRowRange[1]] == null
    );
  }

  private restartLoadingTimer(): void {
    if (this.loadingTimer != null) {
      this.clearLoadingTimer();
    }

    this.loadingTimer = window.setTimeout(() => {
      this.loadingTimer = undefined;
      this.updateState({
        ...this.getState(),
        shouldShowLoading: true,
      });
    }, this.connectOptions.spinnerDelay);
  }

  private clearLoadingTimer(): void {
    if (this.loadingTimer != null) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = undefined;
    }
  }

  private tryClearLoadingState(): void {
    const didClearLoadingTimer = this.tryClearLoadingTimer(this.state);

    if (didClearLoadingTimer) {
      this.updateState({ ...this.state, shouldShowLoading: false });
    }
  }

  private tryClearLoadingTimer(state: SceneTreeState): boolean {
    const loadingShowingOrTimerStarted =
      this.state.shouldShowLoading || this.loadingTimer != null;
    const updateLoadingTimer =
      loadingShowingOrTimerStarted && !this.isViewLoading(state.rows);
    if (updateLoadingTimer) {
      this.clearLoadingTimer();
      return true;
    }
    return false;
  }

  private updateState(newState: SceneTreeState): void {
    const didClearLoadingTimer = this.tryClearLoadingTimer(newState);

    this.state = {
      ...newState,
      shouldShowLoading: didClearLoadingTimer
        ? false
        : newState.shouldShowLoading,
    };

    this.onStateChange.emit(this.state);
  }

  public getPageForOffset(offset: number): number {
    const index = Math.floor(offset / this.rowLimit);
    return this.constrainPageIndex(index);
  }

  public getPageIndexesForRange(start: number, end: number): [number, number] {
    const pageStart = this.getPageForOffset(start);
    const pageEnd = this.getPageForOffset(end);
    return [pageStart, pageEnd];
  }

  private async fetchTree(
    offset: number,
    limit: number,
    jwt: string
  ): Promise<GetTreeResponse> {
    return this.requestUnary(jwt, (metadata, handler) => {
      const pager = new OffsetPager();
      pager.setOffset(offset);
      pager.setLimit(limit);

      const req = new GetTreeRequest();
      req.setPager(pager);
      req.setAdditionalColumnKeysList(this.metadataKeys);

      this.client.getTree(req, metadata, handler);
    });
  }

  private requestUnary<R>(
    jwt: string,
    req: (
      metadata: grpc.Metadata,
      handler: (err: ServiceError | null, res: R | null) => void
    ) => void
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const metadata = this.createJwtMetadata(jwt);

      req(metadata, (err, res) => {
        if (err != null) {
          reject(err);
        } else if (res != null) {
          resolve(res);
        } else {
          reject(
            new SceneTreeError(
              'Invalid response. Both error and result are null'
            )
          );
        }
      });
    });
  }

  private requestServerStream<R>(
    jwt: string,
    req: (metadata: grpc.Metadata) => ResponseStream<R>
  ): ResponseStream<R> {
    const metadata = this.createJwtMetadata(jwt);
    return req(metadata);
  }

  private createJwtMetadata(jwt: string): grpc.Metadata {
    return new grpc.Metadata({
      'jwt-context': JSON.stringify({ jwt }),
    });
  }

  private async ifConnectionHasJwt<T>(then: (jwt: string) => T): Promise<T> {
    const { connection } = this.state;
    if (connection.type === 'connecting' || connection.type === 'connected') {
      const jwt = await connection.jwtProvider();
      if (jwt != null) {
        return then(jwt);
      } else {
        throw new SceneTreeUnauthorizedError(
          'SceneTreeController cannot perform request. Viewer JWT is undefined.'
        );
      }
    } else if (connection.type === 'cancelled') {
      throw new SceneTreeConnectionCancelledError(
        `Request attempted, but controller was cancelled`
      );
    } else {
      throw new SceneTreeError('SceneTreeController is not in connected state');
    }
  }

  private ifErrorIsFatal(error: unknown, then: VoidFunction): void {
    if (!(error instanceof SceneTreeConnectionCancelledError)) {
      then();
    }
  }

  private getConnectionError(
    e: ServiceError | Error | unknown
  ): SceneTreeErrorDetails {
    if (isGrpcServiceError(e)) {
      if (e.code === grpc.Code.FailedPrecondition) {
        return new SceneTreeErrorDetails(
          'SCENE_TREE_DISABLED',
          SceneTreeErrorCode.SCENE_TREE_DISABLED
        );
      } else if (e.code === grpc.Code.Unauthenticated) {
        return new SceneTreeErrorDetails(
          'UNAUTHORIZED',
          SceneTreeErrorCode.UNAUTHORIZED
        );
      } else if (e.code === grpc.Code.Aborted) {
        return new SceneTreeErrorDetails('ABORTED', SceneTreeErrorCode.ABORTED);
      } else {
        return new SceneTreeErrorDetails('UNKNOWN', SceneTreeErrorCode.UNKNOWN);
      }
    } else if (e instanceof SceneTreeUnauthorizedError) {
      return new SceneTreeErrorDetails(
        'UNAUTHORIZED',
        SceneTreeErrorCode.UNAUTHORIZED
      );
    } else {
      return new SceneTreeErrorDetails('UNKNOWN', SceneTreeErrorCode.UNKNOWN);
    }
  }

  private constrainPageRange(start: number, end: number): [number, number] {
    return [Math.max(0, start), Math.min(this.maxPages - 1, end)];
  }

  private constrainPageIndex(index: number): number {
    return Math.max(0, Math.min(index, this.maxPages - 1));
  }

  private constrainRowOffsets(start: number, end: number): [number, number] {
    return [Math.max(0, start), Math.min(this.state.totalRows - 1, end)];
  }

  private get maxPages(): number {
    return Math.max(1, Math.ceil(this.state.totalRows / this.rowLimit));
  }

  private log(message?: string, ...optionalParams: unknown[]): void {
    if (this.debugLogs) {
      console.debug(message, optionalParams);
    }
  }

  private isConnectedState(
    connection: ConnectionState
  ): connection is ConnectedState {
    return connection.type === 'connected';
  }
}
