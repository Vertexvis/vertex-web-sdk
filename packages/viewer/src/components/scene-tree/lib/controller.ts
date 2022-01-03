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
  FilterRequest,
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
import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import { OffsetPager } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { grpc } from '@improbable-eng/grpc-web';
import { Disposable, EventDispatcher } from '@vertexvis/utils';
import { fromNodeProto, Row } from './row';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { SceneTreeErrorCode, SceneTreeErrorDetails } from './errors';
import { isGrpcServiceError } from './grpc';
import { decodeSceneTreeJwt } from './jwt';
import { MetadataKey } from '../interfaces';

export interface ConnectOptions {
  idleReconnectInSeconds?: number;
  lostConnectionReconnectInSeconds?: number;
}

export type JwtProvider = () => string | undefined;

export interface SceneTreeState {
  totalRows: number;
  rows: Row[];
  connection: ConnectionState;
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

export interface ConnectedState {
  type: 'connected';
  jwtProvider: JwtProvider;
  sceneViewId: string;
  subscription: Disposable;
}

export interface ConnectionFailedState {
  type: 'failure';
  details: SceneTreeErrorDetails;
  jwtProvider: JwtProvider;
  sceneViewId: string;
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
   * The metadata keys to filter the tree on.
   */
  columns?: MetadataKey[];
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
  private static IDLE_RECONNECT_IN_SECONDS = 4 * 60;
  private static LOST_CONNECTION_RECONNECT_IN_SECONDS = 2;

  private nextPageId = 0;
  private pages = new Map<number, Page>();
  private activeRowRange = [0, 0];
  private metadataKeys: MetadataKey[] = [];

  private reconnectTimer?: number;

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
    private rowLimit: number,
    private connectOptions: ConnectOptions = {}
  ) {}

  public async connect(jwtProvider: JwtProvider): Promise<void> {
    const { connection } = this.state;
    const jwt = jwtProvider();

    if (jwt == null) {
      throw new Error('Cannot connect scene tree. JWT is undefined');
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
      console.debug('Scene tree controller connecting.');

      await this.fetchPage(0);

      const stream = await this.subscribe();
      stream.on('end', () => this.startConnectionLostReconnectTimer());

      this.updateState({
        ...this.state,
        connection: {
          ...connecting,
          type: 'connected',
          subscription: { dispose: () => stream.cancel() },
        },
      });
    } catch (e) {
      this.updateState({
        ...this.state,
        connection: {
          type: 'failure',
          jwtProvider,
          sceneViewId,
          details: this.getConnectionError(e),
        },
      });
      throw e;
    }

    this.startIdleReconnectTimer();

    if (this.metadataKeys.length > 0) {
      this.setMetadataKeys(this.metadataKeys);
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer != null) {
      window.clearTimeout(this.reconnectTimer);
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
        console.debug(
          'Scene tree controller found viewer JWT. Attempting connection.'
        );

        try {
          await this.connect(() => viewer.token);
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
      dispose: () => {
        viewer.removeEventListener('sceneReady', handleSceneReady);
        this.disconnect();
      },
    };
  }

  public disconnect(reset = false): void {
    console.debug(`Scene tree controller disconnecting [reset=${reset}]`);

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
        throw new Error('Cannot locate node. Location index is undefined.');
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
        console.debug('Scene tree fetching page', index, offset);
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
    await this.ifConnectionHasJwt((jwt) => {
      return this.requestUnary(jwt, (metadata, handler) => {
        const req = new FilterRequest();
        req.setFilter(term);
        req.setFullTree((options.includeCollapsed ?? true) === true);
        if (options.columns) req.setColumnsKeysList(options.columns);

        this.client.filter(req, metadata, handler);
      });
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

      console.debug(
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

      stream.on('data', (msg) => {
        this.startIdleReconnectTimer();

        const { change } = msg.toObject();

        if (change?.listChange != null) {
          console.debug('Received list change', change.listChange.start);
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
          console.debug(
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
          console.debug('Received hidden list change', hiddenList);

          hiddenList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({
              visible: false,
              partiallyVisible: false,
            }))
          );
        }

        if (shownList.length > 0) {
          console.debug('Received shown list change', shownList);

          shownList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({
              visible: true,
              partiallyVisible: false,
            }))
          );
        }

        if (deselectedList.length > 0) {
          console.debug('Received deselected list change', deselectedList);

          deselectedList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({ selected: false }))
          );
        }

        if (selectedList.length > 0) {
          console.debug('Received selected list change', selectedList);

          selectedList.forEach(({ start, end }) =>
            this.patchNodesInRange(start, end, () => ({ selected: true }))
          );
        }
      });

      return stream;
    });
  }

  private async fetchUnloadedPagesInActiveRows(): Promise<void> {
    const [startPage, endPage] = this.getPageIndexesForRange(
      this.activeRowRange[0],
      this.activeRowRange[1]
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

        this.updateState({ ...this.state, totalRows, rows });
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

  private updateState(newState: SceneTreeState): void {
    this.state = newState;
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

  private async ifConnectionHasJwt<T>(then: (jwt: string) => T): Promise<T> {
    const { connection } = this.state;
    if (connection.type === 'connecting' || connection.type === 'connected') {
      const jwt = await connection.jwtProvider();
      if (jwt != null) {
        return then(jwt);
      } else {
        throw new Error(
          'SceneTreeController cannot perform request. Viewer JWT is undefined.'
        );
      }
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
          SceneTreeErrorCode.SCENE_TREE_DISABLED
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
