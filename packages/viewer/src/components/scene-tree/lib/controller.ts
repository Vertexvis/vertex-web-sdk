import {
  ResponseStream,
  SceneTreeAPIClient,
  ServiceError,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import {
  CollapseAllRequest,
  CollapseNodeRequest,
  ExpandAllRequest,
  ExpandNodeRequest,
  GetNodeAncestorsRequest,
  GetNodeAncestorsResponse,
  GetTreeRequest,
  GetTreeResponse,
  LocateItemRequest,
  LocateItemResponse,
  SubscribeRequest,
  SubscribeResponse,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import { OffsetPager } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { grpc } from '@improbable-eng/grpc-web';
import { Disposable, EventDispatcher } from '@vertexvis/utils';
import { fromNodeProto, Row } from './row';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { SceneTreeErrorCode, SceneTreeErrorDetails } from './errors';
import { isGrpcServiceError } from './grpc';
import { decodeSceneTreeJwt } from './jwt';

export interface SceneTreeState {
  totalRows: number;
  rows: Row[];
  connection: ConnectionState;
}

interface Page {
  id: number;
  index: number;
  res: Promise<GetTreeResponse>;
}

export interface DisconnectedState {
  type: 'disconnected';
  jwt?: string;
  sceneViewId?: string;
}

export interface ConnectingState {
  type: 'connecting';
  jwt: string;
  sceneViewId: string;
}

export interface ConnectedState {
  type: 'connected';
  jwt: string;
  sceneViewId: string;
  subscription: Disposable;
}

export interface ConnectionFailedState {
  type: 'failure';
  details: SceneTreeErrorDetails;
  jwt: string;
  sceneViewId: string;
}

type ConnectionState =
  | DisconnectedState
  | ConnectingState
  | ConnectedState
  | ConnectionFailedState;

/**
 * The `SceneTreeController` is responsible for coordinating interactions of the
 * view, fetching and mutating tree data on the server, maintaining state and
 * notifying the view about state changes.
 */
export class SceneTreeController {
  private nextPageId = 0;
  private pages = new Map<number, Page>();
  private activeRowRange = [0, 0];

  /**
   * A dispatcher that emits an event whenever the internal state has changed.
   */
  public onStateChange = new EventDispatcher<SceneTreeState>();

  private state: SceneTreeState = {
    totalRows: 0,
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
    private rowLimit: number
  ) {}

  public async connect(jwt: string): Promise<void> {
    this.disconnectIfSceneViewChanged(jwt);
    await this.connectIfDisconnected(jwt);
  }

  private disconnectIfSceneViewChanged(jwt: string): void {
    const { connection } = this.state;
    const { view: sceneViewId } = decodeSceneTreeJwt(jwt);

    if (
      connection.sceneViewId !== sceneViewId &&
      connection.type !== 'disconnected'
    ) {
      console.debug(
        'Scene tree controller scene view has changed. Disconnecting and clearing state.'
      );
      this.disconnect(true);
    }
  }

  private async connectIfDisconnected(jwt: string): Promise<void> {
    const { connection } = this.state;
    const { view: sceneViewId } = decodeSceneTreeJwt(jwt);

    if (connection.type === 'disconnected') {
      const connecting: ConnectingState = {
        type: 'connecting',
        jwt,
        sceneViewId,
      };
      this.updateState({ ...this.state, connection: connecting });

      try {
        console.debug('Scene tree controller connecting.');

        await this.fetchPage(0);
        const subscription = this.subscribe(jwt);
        this.updateState({
          ...this.state,
          connection: {
            ...connecting,
            type: 'connected',
            subscription,
          },
        });
      } catch (e) {
        this.updateState({
          ...this.state,
          connection: {
            type: 'failure',
            jwt,
            sceneViewId,
            details: this.getConnectionError(e),
          },
        });
        throw e;
      }
    }
  }

  public connectToViewer(viewer: HTMLVertexViewerElement): Disposable {
    const connectWithViewerJwt = async (): Promise<void> => {
      const jwt = await viewer.getJwt();
      if (jwt != null) {
        console.debug(
          'Scene tree controller found viewer JWT. Attempting connection.'
        );

        try {
          await this.connect(jwt);
        } catch (e) {
          console.error('Scene tree controller erred connecting.', e);
        }
      }
    };

    const handleSceneReady = (): void => {
      console.debug('Scene tree controller received scene ready');
      connectWithViewerJwt();
    };

    connectWithViewerJwt();

    viewer.addEventListener('sceneReady', handleSceneReady);
    return {
      dispose: () => viewer.removeEventListener('sceneReady', handleSceneReady),
    };
  }

  public disconnect(reset = false): void {
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
        jwt: connection.jwt,
        sceneViewId: connection.sceneViewId,
      },
      totalRows: reset ? 0 : this.state.totalRows,
      rows: reset ? [] : this.state.rows,
    });
  }

  /**
   * Collapses a node with the given node ID.
   *
   * @param id A node ID to collapse.
   */
  public async collapseNode(id: string): Promise<void> {
    return this.ifConnectionHasJwt(async ({ jwt }) => {
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
    return this.ifConnectionHasJwt(async ({ jwt }) => {
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
    return this.ifConnectionHasJwt(async ({ jwt }) => {
      await this.requestUnary(jwt, (metadata, handler) =>
        this.client.collapseAll(new CollapseAllRequest(), metadata, handler)
      );
    });
  }

  /**
   * Expands all nodes in the tree.
   */
  public async expandAll(): Promise<void> {
    return this.ifConnectionHasJwt(async ({ jwt }) => {
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
    return this.ifConnectionHasJwt(async ({ jwt }) => {
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
        throw new Error('Cannot locate node. Location index is undefined.');
      }

      return locatedIndex.value;
    });
  }

  public async fetchNodeAncestors(nodeId: string): Promise<Node.AsObject[]> {
    return this.ifConnectionHasJwt(async ({ jwt }) => {
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
    return this.ifConnectionHasJwt(async ({ jwt }) => {
      if (index < 0 || index > this.maxPages - 1) {
        return;
      }

      if (!this.pages.has(index)) {
        const offset = index * this.rowLimit;
        console.debug('Scene tree fetching page', index, offset);
        const res = this.fetchTree(offset, this.rowLimit, jwt);
        const id = this.nextPageId++;
        const page = { id, res, index };
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

      console.debug(
        `Scene tree dropped ${pages.length - this.fetchedPageCount} pages`,
        this.pages
      );
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
    await this.fetchUnloadedPagesInActiveRows();
  }

  /**
   * Performs a network request that will listen to server-side changes of the
   * scene tree's data. If the server terminates the connection, this will
   * automatically attempt to resubscribe to changes.
   *
   * @returns A `Disposable` that can be used to terminate the subscription.
   */
  private subscribe(jwt: string): Disposable {
    let stream: ResponseStream<SubscribeResponse> | undefined;

    const sub = (jwt: string): void => {
      stream = this.requestServerStream(jwt, (metadata) =>
        this.client.subscribe(new SubscribeRequest(), metadata)
      );

      stream.on('data', (msg) => {
        const { change } = msg.toObject();

        if (change?.listChange != null) {
          console.debug('Received list change', change.listChange.start);
          this.invalidateAfterOffset(change.listChange.start);
          this.fetchUnloadedPagesInActiveRows();
        }

        const {
          hiddenList = [],
          shownList = [],
          deselectedList = [],
          selectedList = [],
        } = change?.ranges || {};

        if (hiddenList != null && hiddenList.length > 0) {
          console.debug('Received hidden list change', hiddenList);

          hiddenList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({ visible: false }))
          );
        }

        if (shownList != null && shownList.length > 0) {
          console.debug('Received shown list change', shownList);

          shownList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({ visible: true }))
          );
        }

        if (deselectedList != null && deselectedList.length > 0) {
          console.debug('Received deselected list change', deselectedList);

          deselectedList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({ selected: false }))
          );
        }

        if (selectedList != null && selectedList.length > 0) {
          console.debug('Received selected list change', selectedList);

          selectedList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({ selected: true }))
          );
        }
      });

      stream.on('end', () => {
        this.ifConnectionHasJwt(({ jwt }) => sub(jwt));
      });
    };

    sub(jwt);

    return { dispose: () => stream?.cancel() };
  }

  private async fetchUnloadedPagesInActiveRows(): Promise<void> {
    const [startPage, endPage] = this.getPageIndexesForRange(
      this.activeRowRange[0],
      this.activeRowRange[1]
    );

    const pages = this.getNonLoadedPageIndexes(startPage - 1, endPage + 1);
    pages.forEach((page) => this.fetchPage(page));

    if (pages.length > 0) {
      await this.getPage(pages[0])?.res;
    }
  }

  private patchNodesInRange(
    start: number,
    end: number,
    transform: (node: Node.AsObject) => Partial<Node.AsObject>
  ): void {
    const updatedRows = this.state.rows
      .slice(start, end + 1)
      .map((row) =>
        row != null
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
        const fetchedRows = fromNodeProto(offset, itemsList);

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

        this.updateState({ ...this.state, totalRows, rows });
      }
    } catch (e) {
      console.error(
        `Request error fetching page at index ${page.index} (${e.toString()})`
      );

      const currentPage = this.getPage(page.index);
      if (currentPage?.id === page.id) {
        this.invalidatePage(page.index);
      }
    }
  }

  private invalidatePage(index: number): void {
    const boundedIndex = this.constrainPageIndex(index);
    if (this.isPageLoaded(boundedIndex)) {
      this.pages.delete(boundedIndex);
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

  private updateState(newState: SceneTreeState): void {
    this.state = newState;
    this.onStateChangeDispatcher.emit(this.state);
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
          reject(new Error('Invalid response. Both error and result are null'));
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

  private ifConnectionHasJwt<T>(
    then: (connection: ConnectingState | ConnectedState) => T
  ): T {
    const { connection } = this.state;
    if (connection.type === 'connecting' || connection.type === 'connected') {
      return then(connection);
    } else {
      throw new Error('SceneTreeController is not in connected state');
    }
  }

  private getConnectionError(
    e: ServiceError | Error | unknown
  ): SceneTreeErrorDetails {
    if (isGrpcServiceError(e)) {
      if (e.code === grpc.Code.FailedPrecondition) {
        return new SceneTreeErrorDetails(
          SceneTreeErrorCode.SCENE_TREE_DISABLED,
          'https://developer.vertexvis.com'
        );
      } else {
        return new SceneTreeErrorDetails(SceneTreeErrorCode.UNKNOWN);
      }
    } else {
      return new SceneTreeErrorDetails(SceneTreeErrorCode.UNKNOWN);
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
}
