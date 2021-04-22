import 'requestidlecallback-polyfill';
import {
  Component,
  Element,
  Event,
  EventEmitter,
  forceUpdate,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import {
  SceneTreeAPIClient,
  ServiceError,
} from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { grpc } from '@improbable-eng/grpc-web';
import { Disposable } from '@vertexvis/utils';
import classnames from 'classnames';
import { LoadedRow, Row } from './lib/row';
import { CollectionBinding, generateBindings } from './lib/binding';
import { SceneTreeController, SceneTreeState } from './lib/controller';
import { ConnectionStatus } from '../viewer/viewer';
import { Config, parseConfig } from '../../config/config';
import { Environment } from '../../config/environment';
import {
  getSceneTreeContainsElement,
  getSceneTreeOffsetTop,
  getSceneTreeViewportHeight,
  scrollToTop,
} from './lib/dom';
import {
  deselectItem,
  hideItem,
  selectItem,
  SelectItemOptions,
  showItem,
} from './lib/viewer-ops';
import { isGrpcServiceError } from './lib/grpc';
import { readDOM, writeDOM } from '../../utils/stencil';
import { SceneTreeErrorDetails, SceneTreeErrorCode } from './lib/errors';
import { getElementBoundingClientRect } from '../viewer/utils';

export type RowDataProvider = (row: Row) => Record<string, unknown>;

/**
 * The minimum amount of time provided by requestIdleCallback to clear purged
 * data. A value too low may cause contention with browser rendering. A value
 * too high will cause too many items to be accumulated.
 */
const MIN_CLEAR_UNUSED_DATA_MS = 10;

interface StateMap {
  leftTemplate?: HTMLTemplateElement;
  rightTemplate?: HTMLTemplateElement;
  bindings: Map<Element, CollectionBinding>;
  idleCallbackId?: number;
  connected: boolean;
  onStateChangeDisposable?: Disposable;
  subscribeDisposable?: Disposable;
  client?: SceneTreeAPIClient;
  controller?: SceneTreeController;
  componentLoaded: boolean;
}

type OperationHandler = (data: {
  viewer: HTMLVertexViewerElement;
  row: LoadedRow;
}) => void;

/**
 * A set of options to configure the scroll to index behavior.
 */
export interface ScrollToOptions {
  /**
   * Indicates if this operation will be animated. Defaults to `false`.
   */
  animate?: boolean;

  /**
   * Indicates where in the viewport the scrolled to item should be placed.
   * Defaults to `middle`.
   */
  position?: 'start' | 'middle' | 'end';
}

@Component({
  tag: 'vertex-scene-tree',
  styleUrl: 'scene-tree.css',
  shadow: true,
})
export class SceneTree {
  /**
   * The number of offscreen rows above and below the viewport to render. Having
   * a higher number reduces the chance of the browser not displaying a row
   * while scrolling.
   */
  @Prop()
  public overScanCount = 10;

  /**
   * A CSS selector that points to a `<vertex-viewer>` element. Either this
   * property or `viewer` must be set.
   */
  @Prop()
  public viewerSelector?: string;

  /**
   * An instance of a `<vertex-viewer>` element. Either this property or
   * `viewerSelector` must be set.
   */
  @Prop({ reflect: true, mutable: true })
  public viewer?: HTMLVertexViewerElement | null;

  /**
   * A callback that is invoked immediately before a row is about to rendered.
   * This callback can return additional data that can be bound to in a
   * template.
   *
   * @example
   *
   * ```html
   * <script>
   *   const tree = document.querySelector('vertex-scene-tree');
   *   tree.rowData = (row) => {
   *     return { func: () => console.log('row', row.name) };
   *   }
   * </script>
   *
   * <vertex-scene-tree>
   *   <template slot="right">
   *     <button onclick="row.data.func">Hi</button>
   *   </template>
   * </vertex-scene-tree>
   * ```
   */
  @Prop()
  public rowData?: RowDataProvider;

  /**
   * An object to configure the scene tree.
   */
  @Prop()
  public config?: Config;

  /**
   * Sets the default environment for the viewer. This setting is used for
   * auto-configuring network hosts.
   *
   * Use the `config` property for manually setting hosts.
   */
  @Prop()
  public configEnv: Environment = 'platprod';

  /**
   * A JWT token to make authenticated API calls. This is normally automatically
   * assigned from the viewer, and shouldn't be assigned manually.
   */
  @Prop({ reflect: true, mutable: true })
  public jwt: string | undefined;

  /**
   * Disables the default selection behavior of the tree. Can be used to
   * implement custom selection behavior via the trees selection methods.
   *
   * @see SceneTree.selectItem
   * @see SceneTree.deselectItem
   */
  @Prop()
  public selectionDisabled = false;

  @Event()
  public error!: EventEmitter<SceneTreeErrorDetails>;

  @Element()
  private el!: HTMLElement;

  @State()
  private startIndex = 0;

  @State()
  private endIndex = 0;

  @State()
  private viewportHeight: number | undefined;

  @State()
  private viewportRows: Row[] = [];

  @State()
  private isComputingRowHeight = true;

  @State()
  private rows: Row[] = [];

  @State()
  private totalRows = 0;

  @State()
  private scrollTop = 0;

  @State()
  private computedRowHeight: number | undefined;

  /**
   * This stores state that shouldn't trigger a refresh if the data changes.
   * Marking this with @State to allow to preserve state across live-reloads.
   */
  @State()
  private stateMap: StateMap = {
    bindings: new Map(),
    connected: false,
    componentLoaded: false,
  };

  @State()
  private connectionError: SceneTreeErrorDetails | undefined;

  /* eslint-disable lines-between-class-members */
  /**
   * @private Used for internal testing.
   */
  public get client(): SceneTreeAPIClient {
    if (this.stateMap.client != null) {
      return this.stateMap.client;
    } else {
      throw new Error('Client is null.');
    }
  }
  public set client(value: SceneTreeAPIClient) {
    this.stateMap.client = value;
  }
  /* eslint-enable lines-between-class-members */

  /* eslint-disable lines-between-class-members */
  /**
   * @private Used for internal testing
   */
  public get controller(): SceneTreeController | undefined {
    return this.stateMap.controller;
  }
  /**
   * @private Used for internal testing
   */
  public set controller(value: SceneTreeController | undefined) {
    if (this.controller !== value) {
      if (this.controller != null) {
        this.cleanupController();
      }

      this.stateMap.controller = value;

      if (this.controller != null) {
        this.connectController(this.controller);
      }
    }
  }
  /* eslint-enable lines-between-class-members */

  /**
   * Schedules a render of the rows in the scene tree. Useful if any custom
   * data in your scene tree has changed, and you want to update the row's
   * contents.
   *
   * **Note:** This is an asynchronous operation. The update may happen on the
   * next frame.
   */
  @Method()
  public async invalidateRows(): Promise<void> {
    forceUpdate(this.el);
  }

  /**
   * Scrolls the tree to the given row index.
   *
   * @param index An index of the row to scroll to.
   * @param options A set of options to configure the scrolling behavior.
   */
  @Method()
  public async scrollToIndex(
    index: number,
    options: ScrollToOptions = {}
  ): Promise<void> {
    const { animate, position = 'middle' } = options;
    const i = Math.max(0, Math.min(index, this.totalRows));

    const top = this.getScrollToPosition(i, position);
    scrollToTop(this.el, top, { behavior: animate ? 'smooth' : undefined });
  }

  /**
   * Scrolls the tree to an item with the given ID. If the node for the item is
   * not expanded, the tree will expand each of its parent nodes.
   *
   * @param itemId An ID of an item to scroll to.
   * @param options A set of options to configure the scrolling behavior.
   * @returns A promise that resolves when the operation is finished.
   */
  @Method()
  public async scrollToItem(
    itemId: string,
    options: ScrollToOptions = {}
  ): Promise<void> {
    if (this.controller == null) {
      throw new Error('Cannot lookup item. Controller is undefined.');
    }
    const index = await this.controller.expandParentNodes(itemId);

    return new Promise((resolve) => {
      // Scroll to the row after StencilJS has updated the DOM.
      writeDOM(async () => {
        await this.scrollToIndex(index, options);
        resolve();
      });
    });
  }

  /**
   * Performs an API call to expand all nodes in the tree.
   */
  @Method()
  public async expandAll(): Promise<void> {
    await this.controller?.expandAll();
  }

  /**
   * Performs an API call to collapse all nodes in the tree.
   */
  @Method()
  public async collapseAll(): Promise<void> {
    await this.controller?.collapseAll();
  }

  /**
   * Performs an API call that will expand the node associated to the specified
   * row or row index.
   *
   * @param rowOrIndex A row or row index to expand.
   */
  @Method()
  public async expandItem(rowOrIndex: number | Row): Promise<void> {
    await this.performRowOperation(rowOrIndex, async ({ row }) => {
      if (!row.expanded) {
        await this.controller?.expandNode(row.id);
      }
    });
  }

  /**
   * Performs an API call that will collapse the node associated to the
   * specified row or row index.
   *
   * @param rowOrIndex A row or row index to collapse.
   */
  @Method()
  public async collapseItem(rowOrIndex: number | Row): Promise<void> {
    await this.performRowOperation(rowOrIndex, async ({ row }) => {
      if (row.expanded) {
        await this.controller?.collapseNode(row.id);
      }
    });
  }

  /**
   * Performs an API call that will either expand or collapse the node
   * associated to the given row or row index.
   *
   * @param rowOrIndex The row or row index to collapse or expand.
   */
  @Method()
  public async toggleExpandItem(rowOrIndex: number | Row): Promise<void> {
    await this.performRowOperation(rowOrIndex, async ({ row }) => {
      if (row.expanded) {
        await this.collapseItem(row);
      } else {
        await this.expandItem(row);
      }
    });
  }

  /**
   * Performs an API call that will either hide or show the item associated to
   * the given row or row index.
   *
   * @param rowOrIndex The row or row index to toggle visibility.
   */
  @Method()
  public async toggleItemVisibility(rowOrIndex: number | Row): Promise<void> {
    await this.performRowOperation(rowOrIndex, async ({ viewer, row }) => {
      if (row.visible) {
        await hideItem(viewer, row.id);
      } else {
        await showItem(viewer, row.id);
      }
    });
  }

  /**
   * Performs an API call that will hide the item associated to the given row
   * or row index.
   *
   * @param rowOrIndex The row or row index to hide.
   */
  @Method()
  public async hideItem(rowOrIndex: number | Row): Promise<void> {
    await this.performRowOperation(rowOrIndex, async ({ viewer, row }) => {
      if (row.visible) {
        await hideItem(viewer, row.id);
      }
    });
  }

  /**
   * Performs an API call that will show the item associated to the given row
   * or row index.
   *
   * @param rowOrIndex The row or row index to show.
   */
  @Method()
  public async showItem(rowOrIndex: number | Row): Promise<void> {
    await this.performRowOperation(rowOrIndex, async ({ viewer, row }) => {
      if (!row.visible) {
        await showItem(viewer, row.id);
      }
    });
  }

  /**
   * Performs an API call that will select the item associated to the given row
   * or row index.
   *
   * @param rowOrIndex The row or row index to select.
   * @param append `true` if the selection should append to the current
   *  selection, or `false` if this should replace the current selection.
   *  Defaults to replace.
   */
  @Method()
  public async selectItem(
    rowOrIndex: number | Row,
    options: SelectItemOptions = {}
  ): Promise<void> {
    await this.performRowOperation(rowOrIndex, async ({ viewer, row }) => {
      await selectItem(viewer, row.id, options);
    });
  }

  /**
   * Performs an API call that will deselect the item associated to the given
   * row or row index.
   *
   * @param rowOrIndex The row or row index to deselect.
   */
  @Method()
  public async deselectItem(rowOrIndex: number | Row): Promise<void> {
    await this.performRowOperation(rowOrIndex, async ({ viewer, row }) => {
      if (row.selected) {
        await deselectItem(viewer, row.id);
      }
    });
  }

  /**
   * Returns a row at the given index. If the row data has not been loaded,
   * returns `undefined`.
   *
   * @param index The index of the row.
   * @returns A row, or `undefined` if the row hasn't been loaded.
   */
  @Method()
  public async getRowAtIndex(index: number): Promise<Row> {
    return this.rows[index];
  }

  /**
   * Returns the row data from the given mouse or pointer event. The event
   * must originate from this component otherwise `undefined` is returned.
   *
   * @param event A mouse or pointer event that originated from this component.
   * @returns A row, or `undefined` if the row hasn't been loaded.
   */
  @Method()
  public async getRowForEvent(event: MouseEvent | PointerEvent): Promise<Row> {
    const { clientY, currentTarget } = event;
    const rowsEl = this.el.shadowRoot?.querySelector('.rows');
    if (
      currentTarget != null &&
      rowsEl != null &&
      getSceneTreeContainsElement(rowsEl, currentTarget as HTMLElement)
    ) {
      return this.getRowAtClientY(clientY);
    } else {
      return undefined;
    }
  }

  /**
   * Returns the row data from the given vertical client position.
   *
   * @param clientY The vertical client position.
   * @returns A row or `undefined` if the row hasn't been loaded.
   */
  @Method()
  public getRowAtClientY(clientY: number): Promise<Row> {
    const index = Math.floor(
      (clientY - getElementBoundingClientRect(this.el).top + this.scrollTop) /
        this.getComputedOrPlaceholderRowHeight()
    );
    return this.getRowAtIndex(index);
  }

  protected connectedCallback(): void {
    console.log('connected callback', this.configEnv);
    // if (this.viewer != null) {
    //   this.connectViewer(this.viewer);
    // }
  }

  protected disconnectedCallback(): void {
    if (this.viewer != null) {
      this.disconnectViewer(this.viewer);
    }
  }

  protected componentWillLoad(): void {
    const { sceneTreeHost } = this.getConfig().network;
    this.client = new SceneTreeAPIClient(sceneTreeHost);

    if (this.viewerSelector != null) {
      this.viewer = document.querySelector(this.viewerSelector) as
        | HTMLVertexViewerElement
        | undefined;
    }

    if (this.viewer != null) {
      this.connectViewer(this.viewer);
    }
  }

  protected async componentDidLoad(): Promise<void> {
    this.el.addEventListener('scroll', () => this.handleScroll());

    this.stateMap.leftTemplate =
      (this.el.querySelector('template[slot="left"]') as HTMLTemplateElement) ||
      undefined;

    this.stateMap.rightTemplate =
      (this.el.querySelector(
        'template[slot="right"]'
      ) as HTMLTemplateElement) || undefined;

    readDOM(() => {
      this.viewportHeight = getSceneTreeViewportHeight(this.el);
      this.updateRenderState();
    });

    this.stateMap.componentLoaded = true;
  }

  protected componentWillRender(): void {
    this.updateRenderState();
    this.controller?.updateActiveRowRange(this.startIndex, this.endIndex);
  }

  protected componentDidRender(): void {
    this.cleanupBindings();
    this.computeRowHeight();
  }

  protected render(): h.JSX.IntrinsicElements {
    const rowHeight = this.getComputedOrPlaceholderRowHeight();
    const totalHeight = this.totalRows * rowHeight;
    const startY = this.startIndex * rowHeight;
    return (
      <Host>
        {this.connectionError != null && (
          <div class="error">
            <span>
              {this.connectionError.message}
              {this.connectionError.link && (
                <span>
                  {' '}
                  See our{' '}
                  <a href={this.connectionError.link} target="_blank">
                    documentation
                  </a>{' '}
                  for more information.
                </span>
              )}
            </span>
          </div>
        )}

        <div class="rows" style={{ height: `${totalHeight}px` }}>
          {this.isComputingRowHeight ? (
            <div class="row" />
          ) : (
            this.viewportRows.map((row, i) => {
              if (row == null) {
                return <div class="row"></div>;
              } else {
                return (
                  <div
                    class={classnames('row', { 'is-selected': row.selected })}
                    style={{ top: `${startY + rowHeight * i}px` }}
                    onMouseDown={(event) => this.handleRowMouseDown(event, row)}
                  >
                    <span
                      ref={(el) => {
                        if (el != null && this.stateMap.leftTemplate != null) {
                          this.populateSlot(
                            this.stateMap.leftTemplate,
                            row,
                            el
                          );
                        }
                      }}
                    />
                    <span
                      style={{
                        'margin-left': `${row.depth * 8}px`,
                      }}
                    />
                    <span
                      class="expand-toggle"
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        this.toggleExpandItem(row);
                      }}
                      onMouseUp={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {!row.isLeaf && row.expanded && '▾'}
                      {!row.isLeaf && !row.expanded && '▸'}
                    </span>
                    <span class="row-text" title={row.name}>
                      {row.name}
                    </span>

                    {this.stateMap.rightTemplate != null ? (
                      <span
                        ref={(el) => {
                          if (
                            el != null &&
                            this.stateMap.rightTemplate != null
                          ) {
                            this.populateSlot(
                              this.stateMap.rightTemplate,
                              row,
                              el
                            );
                          }
                        }}
                      />
                    ) : (
                      <button
                        class={classnames('visibility-btn', {
                          'is-hidden': !row.visible,
                        })}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          this.toggleItemVisibility(this.startIndex + i);
                        }}
                        onMouseUp={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {row.visible ? (
                          <vertex-viewer-icon name="visible" size="sm" />
                        ) : (
                          <vertex-viewer-icon name="hidden" size="sm" />
                        )}
                      </button>
                    )}
                  </div>
                );
              }
            })
          )}
        </div>
      </Host>
    );
  }

  @Watch('viewer')
  protected async handleViewerChanged(
    newViewer: HTMLVertexViewerElement | undefined,
    oldViewer: HTMLVertexViewerElement | undefined
  ): Promise<void> {
    // StencilJS will invoke this callback even before the component has been
    // loaded. According to their docs, this shouldn't happen. Return if the
    // component hasn't been loaded.
    // See https://stenciljs.com/docs/reactive-data#watch-decorator
    if (!this.stateMap.componentLoaded) {
      return;
    }

    if (oldViewer != null) {
      this.controller = undefined;
      this.disconnectViewer(oldViewer);
    }

    if (newViewer != null) {
      this.connectViewer(newViewer);
    }
  }

  @Watch('jwt')
  protected handleJwtChanged(): void {
    if (this.controller != null) {
      this.connectController(this.controller);
    }
  }

  private handleRowMouseDown(event: MouseEvent, row: LoadedRow): void {
    if (!this.selectionDisabled && event.button === 0) {
      if (event.metaKey && row.selected) {
        this.deselectItem(row);
      } else {
        this.selectItem(row, { append: event.ctrlKey || event.metaKey });
      }
    }
  }

  private handleViewerSceneReady = (): void => {
    console.debug('Scene tree received viewer scene ready');
    this.createController();
  };

  private async createController(): Promise<void> {
    this.controller = new SceneTreeController(this.client, 100, () => {
      if (this.jwt != null) {
        return this.jwt;
      } else {
        throw new Error('Cannot update subscription. JWT is null.');
      }
    });
  }

  private cleanupController(): void {
    this.stateMap.onStateChangeDisposable?.dispose();
    this.stateMap.subscribeDisposable?.dispose();
    this.stateMap.connected = false;
  }

  private async connectController(
    controller: SceneTreeController
  ): Promise<void> {
    if (this.jwt != null && !this.stateMap.connected) {
      this.stateMap.onStateChangeDisposable = controller.onStateChange.on(
        (state) => {
          this.handleControllerStateChange(state);
          this.scheduleClearUnusedData();
        }
      );

      try {
        await controller.fetchPage(0);
        this.stateMap.subscribeDisposable = controller.subscribe();
        this.stateMap.connected = true;
      } catch (e) {
        if (isGrpcServiceError(e)) {
          this.handleConnectionError(e);
        }
      }
    }
  }

  private handleConnectionError(e: ServiceError): void {
    if (e.code === grpc.Code.FailedPrecondition) {
      this.connectionError = new SceneTreeErrorDetails(
        SceneTreeErrorCode.SCENE_TREE_DISABLED,
        'https://developer.vertexvis.com'
      );
    } else {
      this.connectionError = new SceneTreeErrorDetails(
        SceneTreeErrorCode.UNKNOWN
      );
    }

    this.error.emit(this.connectionError);
  }

  private async connectViewer(viewer: HTMLVertexViewerElement): Promise<void> {
    viewer.addEventListener('sceneReady', this.handleViewerSceneReady);
    viewer.addEventListener(
      'connectionChange',
      this.handleViewerConnectionStatusChange
    );

    const isSceneReady = await viewer.isSceneReady();
    if (isSceneReady) {
      this.jwt = await viewer.getJwt();
      this.createController();
    }
  }

  private disconnectViewer(viewer: HTMLVertexViewerElement): void {
    viewer.removeEventListener('sceneReady', this.handleViewerSceneReady);
    viewer.removeEventListener(
      'connectionChange',
      this.handleViewerConnectionStatusChange
    );
  }

  private scheduleClearUnusedData(): void {
    if (this.stateMap.idleCallbackId != null) {
      window.cancelIdleCallback(this.stateMap.idleCallbackId);
    }

    if (this.controller != null) {
      this.stateMap.idleCallbackId = window.requestIdleCallback((foo) => {
        const remaining = foo.timeRemaining?.();

        if (remaining == null || remaining >= MIN_CLEAR_UNUSED_DATA_MS) {
          const [start, end] =
            this.controller?.getPageIndexesForRange(
              this.startIndex,
              this.startIndex + this.viewportRows.length
            ) || [];

          if (start != null && end != null) {
            this.controller?.invalidatePagesOutsideRange(start, end, 50);
          }
        } else {
          this.scheduleClearUnusedData();
        }
      });
    }
  }

  private handleViewerConnectionStatusChange = (event: Event): void => {
    const { detail } = event as CustomEvent<ConnectionStatus>;
    if (detail.status === 'connected') {
      console.debug('Scene tree received new token');
      this.jwt = detail.jwt;
    }
  };

  private handleControllerStateChange(state: SceneTreeState): void {
    this.rows = state.rows;
    this.totalRows = state.totalRows;
  }

  private async performRowOperation(
    rowOrIndex: number | Row,
    op: OperationHandler
  ): Promise<void> {
    const row =
      typeof rowOrIndex === 'number' ? this.rows[rowOrIndex] : rowOrIndex;

    if (row == null) {
      throw new Error(`Cannot perform scene tree operation. Row not found.`);
    }

    if (this.viewer == null) {
      throw new Error(
        `Cannot perform scene tree operation. Cannot get reference to viewer.`
      );
    }

    await op({ viewer: this.viewer, row });
  }

  private updateRenderState(): void {
    if (this.viewportHeight != null) {
      const rowHeight = this.getComputedOrPlaceholderRowHeight();
      const viewportCount = Math.ceil(this.viewportHeight / rowHeight);

      this.startIndex = Math.max(
        0,
        Math.floor(this.scrollTop / rowHeight) - this.overScanCount
      );
      this.endIndex = Math.min(
        this.totalRows,
        this.startIndex + viewportCount + this.overScanCount * 2
      );

      const rows = this.getViewportRows(
        this.startIndex,
        this.endIndex
      ).map((row) => this.populateRowData(row));
      this.viewportRows = rows;
    }
  }

  private getViewportRows(start: number, end: number): Row[] {
    return this.rows.slice(start, end);
  }

  private populateSlot(
    template: HTMLTemplateElement,
    row: Row,
    el: HTMLElement
  ): void {
    if (el.firstElementChild == null) {
      const node = template.content.cloneNode(true);
      el.appendChild(node);
    }

    if (el.firstElementChild != null) {
      let binding = this.stateMap.bindings.get(el);
      if (binding == null) {
        binding = new CollectionBinding(generateBindings(el.firstElementChild));
        this.stateMap.bindings.set(el, binding);
      }
      binding.bind(row);
    }
  }

  private handleScroll(): void {
    readDOM(() => {
      this.scrollTop = this.el.scrollTop || 0;
    });
  }

  private populateRowData(row: Row): Row {
    if (this.rowData != null && row != null) {
      const data = this.rowData?.(row) || {};
      return { ...row, data };
    } else {
      return row;
    }
  }

  private cleanupBindings(): void {
    for (const key of this.stateMap.bindings.keys()) {
      if (key.parentElement == null) {
        this.stateMap.bindings.delete(key);
      }
    }
  }

  private computeRowHeight(): void {
    if (this.isComputingRowHeight) {
      // Set the state on the next event tick to prevent a warning from
      // StencilJS.
      setTimeout(() => {
        const rowEl = this.el.shadowRoot?.querySelector('.row');
        this.computedRowHeight = rowEl?.clientHeight;
        this.isComputingRowHeight = false;
      }, 0);
    }
  }

  private getComputedOrPlaceholderRowHeight(): number {
    return this.computedRowHeight || 24;
  }

  private getScrollToPosition(
    index: number,
    position: ScrollToOptions['position']
  ): number {
    const constrainedIndex = Math.max(0, Math.min(index, this.totalRows - 1));
    const viewportHeight = this.viewportHeight || 0;
    const rowHeight = this.getComputedOrPlaceholderRowHeight();

    if (position === 'start') {
      return constrainedIndex * rowHeight;
    } else if (position === 'middle') {
      const rowCenterY = constrainedIndex * rowHeight + rowHeight / 2;
      return rowCenterY - viewportHeight / 2;
    } else {
      const rowBottomY = constrainedIndex * rowHeight + rowHeight;
      return rowBottomY - viewportHeight;
    }
  }

  private getConfig(): Config {
    return parseConfig(this.configEnv, this.config);
  }
}
