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
  GetTreeRequest,
  GetTreeResponse,
  SubscribeRequest,
  SubscribeResponse,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb';
import { Uuid } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import { OffsetPager } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { grpc } from '@improbable-eng/grpc-web';
import { Disposable, EventDispatcher } from '@vertexvis/utils';
import decodeJwt, { JwtPayload } from 'jwt-decode';
import { fromNodeProto, Row } from './row';

export interface SceneTreeState {
  totalRows: number;
  rows: Row[];
}

interface Page {
  id: number;
  index: number;
  res: Promise<GetTreeResponse>;
}

// TODO(dan): add other fields.
interface SceneTreeJwtPayload extends JwtPayload {
  view: string;
  scene: string;
}

/**
 * The `SceneTreeController` is responsible for coordinating interactions of the
 * view, fetching and mutating tree data on the server, maintaining state and
 * notifying the view about state changes.
 */
export class SceneTreeController {
  private nextPageId = 0;
  private pages = new Map<number, Page>();

  private state: SceneTreeState = {
    totalRows: 0,
    rows: [],
  };

  /**
   * A dispatcher that emits an event whenever the internal state has changed.
   */
  public onStateChange = new EventDispatcher<SceneTreeState>();

  /**
   * The number of pages that have been fetched.
   */
  public get fetchedPageCount(): number {
    return this.pages.size;
  }

  public constructor(
    private client: SceneTreeAPIClient,
    private rowLimit: number
  ) {}

  /**
   * Performs a network request that will listen to server-side changes of the
   * scene tree's data. If the server terminates the connection, this will
   * automatically attempt to resubscribe to changes.
   *
   * @param jwt A JWT token used to auth with the server.
   * @returns A `Disposable` that can be used to terminate the subscription.
   */
  public subscribe(jwt: () => string): Disposable {
    let stream: ResponseStream<SubscribeResponse> | undefined;

    const sub = (): void => {
      const viewId = new Uuid();
      viewId.setHex(this.getSceneViewId(jwt()));

      const req = new SubscribeRequest();
      req.setViewId(viewId);

      stream = this.requestServerStream(jwt(), (metadata) =>
        this.client.subscribe(req, metadata)
      );

      stream.on('data', (msg) => {
        const { change } = msg.toObject();

        if (change?.listChange != null) {
          console.debug('Received list change', change.listChange.start);
          this.invalidateAfterOffset(change.listChange.start);
          this.fetchPageAtOffset(change.listChange.start, jwt());
        }
      });

      stream.on('end', () => {
        sub();
      });
    };

    sub();

    return { dispose: () => stream?.cancel() };
  }

  /**
   * Collapses a node with the given node ID.
   *
   * @param id A node ID to collapse.
   * @param jwt A JWT token to authenticate with the server.
   */
  public async collapseNode(id: string, jwt: string): Promise<void> {
    const viewId = new Uuid();
    viewId.setHex(this.getSceneViewId(jwt));
    const nodeId = new Uuid();
    nodeId.setHex(id);

    const req = new CollapseNodeRequest();
    req.setViewId(viewId);
    req.setNodeId(nodeId);

    await this.requestUnary(jwt, (metadata, handler) =>
      this.client.collapseNode(req, metadata, handler)
    );
  }

  /**
   * Expands a node with the given node ID.
   *
   * @param id A node ID to expand.
   * @param jwt A JWT token to authenticate with the server.
   */
  public async expandNode(id: string, jwt: string): Promise<void> {
    const viewId = new Uuid();
    viewId.setHex(this.getSceneViewId(jwt));
    const nodeId = new Uuid();
    nodeId.setHex(id);

    const req = new ExpandNodeRequest();
    req.setViewId(viewId);
    req.setNodeId(nodeId);

    await this.requestUnary(jwt, (metadata, handler) =>
      this.client.expandNode(req, metadata, handler)
    );
  }

  /**
   * Collapses all nodes in the tree.
   *
   * @param jwt A JWT token used to authenticate with the server.
   */
  public async collapseAll(jwt: string): Promise<void> {
    const req = new CollapseAllRequest();
    await this.requestUnary(jwt, (metadata, handler) =>
      this.client.collapseAll(req, metadata, handler)
    );
  }

  /**
   * Expands all nodes in the tree.
   *
   * @param jwt A JWT token used to authenticate with the server.
   */
  public async expandAll(jwt: string): Promise<void> {
    const req = new ExpandAllRequest();
    await this.requestUnary(jwt, (metadata, handler) =>
      this.client.expandAll(req, metadata, handler)
    );
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
   * @param jwt A JWT token to authenticate with the server.
   */
  public async fetchPage(index: number, jwt: string): Promise<void> {
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
  }

  /**
   * Fetches a page that contains the given row offset.
   *
   * @param offset The row offset of the page to fetch.
   * @param jwt A JWT token to authenticate with the server.
   */
  public fetchPageAtOffset(offset: number, jwt: string): Promise<void> {
    const page = Math.floor(offset / this.rowLimit);
    return this.fetchPage(page, jwt);
  }

  /**
   * Fetches pages that contain the given row ranges.
   *
   * @param startOffset A start offset, inclusive.
   * @param endOffset The end offset, inclusive.
   * @param jwt A JWT token used to authenticate with the server.
   */
  public async fetchRange(
    startOffset: number,
    endOffset: number,
    jwt: string
  ): Promise<void> {
    const startPage = Math.floor(startOffset / this.rowLimit);
    const endPage = Math.floor(endOffset / this.rowLimit);
    const [boundedStart, boundedEnd] = this.constrainPageRange(
      startPage,
      endPage
    );
    const pageCount = boundedEnd - boundedStart + 1;
    await Promise.all(
      Array.from({ length: pageCount }).map((_, page) =>
        this.fetchPage(page, jwt)
      )
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

  private async handlePageResult(page: Page): Promise<void> {
    const res = await page.res;

    const currentPage = this.pages.get(page.index);
    // Only handle the result if the page has not been invalidated.
    if (currentPage?.id === page.id) {
      const cursor = res.getCursor();
      const itemsList = res.getItemsList();

      const totalRows = cursor?.getTotal() ?? 0;
      const offset = page.index * this.rowLimit;
      const fetchedRows = fromNodeProto(itemsList);

      const start = this.state.rows.slice(0, offset);
      const end = this.state.rows.slice(
        start.length + fetchedRows.length,
        totalRows
      );
      const fill = new Array(
        totalRows - start.length - fetchedRows.length - end.length
      );
      const rows = [...start, ...fetchedRows, ...end, ...fill];

      this.updateState({ ...this.state, totalRows, rows });
    }
  }

  private invalidatePage(index: number): void {
    const boundedIndex = this.constrainPageIndex(index);
    if (this.isPageLoaded(boundedIndex)) {
      const offset = this.getOffsetForPage(boundedIndex);

      const rows = this.state.rows.concat();
      rows.splice(offset, this.rowLimit, ...new Array(this.rowLimit));

      this.pages.delete(boundedIndex);
      this.updateState({ ...this.state, rows });
    }
  }

  private invalidateAfterOffset(offset: number): void {
    const pageIndex = Math.floor(offset / this.rowLimit);
    const nextPageIndex = pageIndex + 1;
    const nextPageOffset = nextPageIndex * this.rowLimit;

    const start = this.state.rows.slice(0, nextPageOffset);
    const end = new Array(this.state.totalRows - start.length);
    const rows = [...start, ...end];

    for (const index of this.pages.keys()) {
      if (index >= pageIndex) {
        this.pages.delete(index);
      }
    }
    this.updateState({ ...this.state, rows });
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
      const viewId = new Uuid();
      viewId.setHex(this.getSceneViewId(jwt));

      const pager = new OffsetPager();
      pager.setOffset(offset);
      pager.setLimit(limit);

      const req = new GetTreeRequest();
      req.setViewId(viewId);
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

  private getOffsetForPage(index: number): number {
    return index * this.rowLimit;
  }

  private constrainPageRange(start: number, end: number): [number, number] {
    return [Math.max(0, start), Math.min(this.maxPages - 1, end)];
  }

  private constrainPageIndex(index: number): number {
    return Math.max(0, Math.min(index, this.maxPages - 1));
  }

  /**
   * TODO(dan): Remove after https://vertexvis.atlassian.net/browse/API-1747 is
   * implemented. Make sure to `yarn remove jwt_decode` as well.
   */
  private getSceneViewId(jwt: string): string {
    return decodeJwt<SceneTreeJwtPayload>(jwt).view;
  }

  private get maxPages(): number {
    return Math.max(1, Math.ceil(this.state.totalRows / this.rowLimit));
  }
}
