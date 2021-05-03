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
import { SceneTreeAPIClient } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { Disposable } from '@vertexvis/utils';
import { isLoadedRow, LoadedRow, Row } from './lib/row';
import { SceneTreeController, SceneTreeState } from './lib/controller';
import { Config, parseConfig } from '../../config/config';
import { Environment } from '../../config/environment';
import {
  getSceneTreeContainsElement,
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
import { readDOM, writeDOM } from '../../utils/stencil';
import { SceneTreeErrorDetails } from './lib/errors';
import { getElementBoundingClientRect } from '../viewer/utils';
import { ElementPool } from './lib/element-pool';
import {
  generateInstanceFromTemplate,
  InstancedTemplate,
} from './lib/templates';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';

export type RowDataProvider = (row: Row) => Record<string, unknown>;

/**
 * The minimum amount of time provided by requestIdleCallback to clear purged
 * data. A value too low may cause contention with browser rendering. A value
 * too high will cause too many items to be accumulated.
 */
const MIN_CLEAR_UNUSED_DATA_MS = 25;

interface StateMap {
  idleCallbackId?: number;
  resizeObserver?: ResizeObserver;
  componentLoaded: boolean;

  client?: SceneTreeAPIClient;
  jwt?: string;

  onStateChangeDisposable?: Disposable;
  subscribeDisposable?: Disposable;
  viewerDisposable?: Disposable;

  elementPool?: ElementPool;
  template?: HTMLTemplateElement;

  startIndex: number;
  endIndex: number;
  viewportRows: Row[];
  viewportRowMap: Map<string, Row>;
}

type OperationHandler = (data: {
  viewer: HTMLVertexViewerElement;
  id: string;
  node: Node.AsObject;
}) => void;

export type RowArg = number | Row | Node.AsObject;

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
  public overScanCount = 25;

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
   * Disables the default selection behavior of the tree. Can be used to
   * implement custom selection behavior via the trees selection methods.
   *
   * @see SceneTree.selectItem
   * @see SceneTree.deselectItem
   */
  @Prop()
  public selectionDisabled = false;

  @Prop({ mutable: true, reflect: true })
  public controller!: SceneTreeController;

  @Event()
  public connectionError!: EventEmitter<SceneTreeErrorDetails>;

  @Element()
  private el!: HTMLElement;

  @State()
  private viewportHeight: number | undefined;

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
    componentLoaded: false,
    startIndex: 0,
    endIndex: 0,
    viewportRows: [],
    viewportRowMap: new Map(),
  };

  @State()
  private connectionErrorDetails: SceneTreeErrorDetails | undefined;

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
    await this.controller.expandAll();
  }

  /**
   * Performs an API call to collapse all nodes in the tree.
   */
  @Method()
  public async collapseAll(): Promise<void> {
    await this.controller.collapseAll();
  }

  /**
   * Performs an API call that will expand the node associated to the specified
   * row or row index.
   *
   * @param row A row, row index, or node to expand.
   */
  @Method()
  public async expandItem(row: RowArg): Promise<void> {
    await this.performRowOperation(row, async ({ id, node }) => {
      if (!node.expanded) {
        await this.controller.expandNode(id);
      }
    });
  }

  /**
   * Performs an API call that will collapse the node associated to the
   * specified row or row index.
   *
   * @param row A row, row index, or node to collapse.
   */
  @Method()
  public async collapseItem(row: RowArg): Promise<void> {
    await this.performRowOperation(row, async ({ id, node }) => {
      if (node.expanded) {
        await this.controller.collapseNode(id);
      }
    });
  }

  /**
   * Performs an API call that will either expand or collapse the node
   * associated to the given row or row index.
   *
   * @param row The row, row index, or node to collapse or expand.
   */
  @Method()
  public async toggleExpandItem(row: RowArg): Promise<void> {
    await this.performRowOperation(row, async ({ node }) => {
      if (node.expanded) {
        await this.collapseItem(node);
      } else {
        await this.expandItem(node);
      }
    });
  }

  /**
   * Performs an API call that will either hide or show the item associated to
   * the given row or row index.
   *
   * @param row The row, row index, or node to toggle visibility.
   */
  @Method()
  public async toggleItemVisibility(row: RowArg): Promise<void> {
    await this.performRowOperation(row, async ({ viewer, id, node }) => {
      if (node.visible) {
        await hideItem(viewer, id);
      } else {
        await showItem(viewer, id);
      }
    });
  }

  /**
   * Performs an API call that will hide the item associated to the given row
   * or row index.
   *
   * @param row The row, row index, or node to hide.
   */
  @Method()
  public async hideItem(row: RowArg): Promise<void> {
    await this.performRowOperation(row, async ({ viewer, id, node }) => {
      if (node.visible) {
        await hideItem(viewer, id);
      }
    });
  }

  /**
   * Performs an API call that will show the item associated to the given row
   * or row index.
   *
   * @param row The row, row index, or node to show.
   */
  @Method()
  public async showItem(row: RowArg): Promise<void> {
    await this.performRowOperation(row, async ({ viewer, id, node }) => {
      if (!node.visible) {
        await showItem(viewer, id);
      }
    });
  }

  /**
   * Performs an API call that will select the item associated to the given row
   * or row index.
   *
   * @param row The row, row index or node to select.
   * @param append `true` if the selection should append to the current
   *  selection, or `false` if this should replace the current selection.
   *  Defaults to replace.
   */
  @Method()
  public async selectItem(
    row: RowArg,
    options: SelectItemOptions = {}
  ): Promise<void> {
    await this.performRowOperation(row, async ({ viewer, id }) => {
      await selectItem(viewer, id, options);
    });
  }

  /**
   * Performs an API call that will deselect the item associated to the given
   * row or row index.
   *
   * @param row The row, row index, or node to deselect.
   */
  @Method()
  public async deselectItem(row: RowArg): Promise<void> {
    await this.performRowOperation(row, async ({ viewer, id, node }) => {
      if (node.selected) {
        await deselectItem(viewer, id);
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
    if (
      currentTarget != null &&
      this.connectionErrorDetails == null &&
      getSceneTreeContainsElement(this.el, currentTarget as HTMLElement)
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
    const { top } = getElementBoundingClientRect(this.el);
    const index = Math.floor(
      (clientY - top + this.scrollTop) /
        this.getComputedOrPlaceholderRowHeight()
    );
    return this.getRowAtIndex(index);
  }

  protected componentWillLoad(): void {
    if (this.viewerSelector != null) {
      this.viewer = document.querySelector(this.viewerSelector) as
        | HTMLVertexViewerElement
        | undefined;
    }

    if (this.controller == null) {
      const { sceneTreeHost } = this.getConfig().network;
      const client = new SceneTreeAPIClient(sceneTreeHost);
      this.controller = new SceneTreeController(client, 100);
      this.stateMap.onStateChangeDisposable = this.controller.onStateChange.on(
        (state) => this.handleControllerStateChange(state)
      );
    }

    if (this.viewer != null) {
      this.stateMap.viewerDisposable = this.controller.connectToViewer(
        this.viewer
      );
    }
  }

  protected async componentDidLoad(): Promise<void> {
    this.el.addEventListener('scroll', () => this.handleScroll(), {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(() =>
      this.updateViewportHeight()
    );
    resizeObserver.observe(this.el);
    this.stateMap.resizeObserver = resizeObserver;

    this.ensureTemplateDefined();

    this.updateViewportHeight();
    await this.computeRowHeight();
    this.createPool();

    this.stateMap.componentLoaded = true;
  }

  protected componentWillRender(): void {
    this.updateRenderState();

    if (this.controller.isConnected) {
      this.controller.updateActiveRowRange(
        this.stateMap.startIndex,
        this.stateMap.endIndex
      );
    }
  }

  protected componentDidRender(): void {
    this.updateElements();
  }

  protected render(): h.JSX.IntrinsicElements {
    const rowHeight = this.getComputedOrPlaceholderRowHeight();
    const totalHeight = this.totalRows * rowHeight;
    return (
      <Host>
        {this.connectionErrorDetails != null && (
          <div class="error">
            <span>
              {this.connectionErrorDetails.message}
              {this.connectionErrorDetails.link && (
                <span>
                  {' '}
                  See our{' '}
                  <a href={this.connectionErrorDetails.link} target="_blank">
                    documentation
                  </a>{' '}
                  for more information.
                </span>
              )}
            </span>
          </div>
        )}

        <div class="rows" style={{ height: `${totalHeight}px` }}>
          <slot></slot>
        </div>
      </Host>
    );
  }

  @Watch('viewer')
  protected handleViewerChanged(
    newViewer: HTMLVertexViewerElement | undefined,
    oldViewer: HTMLVertexViewerElement | undefined
  ): void {
    // StencilJS will invoke this callback even before the component has been
    // loaded. According to their docs, this shouldn't happen. Return if the
    // component hasn't been loaded.
    // See https://stenciljs.com/docs/reactive-data#watch-decorator
    if (!this.stateMap.componentLoaded) {
      return;
    }

    if (oldViewer != null) {
      this.stateMap.viewerDisposable?.dispose();
    }

    if (newViewer != null) {
      this.stateMap.viewerDisposable = this.controller.connectToViewer(
        newViewer
      );
    }
  }

  @Watch('controller')
  protected handleControllerChanged(newController: SceneTreeController): void {
    // StencilJS will invoke this callback even before the component has been
    // loaded. According to their docs, this shouldn't happen. Return if the
    // component hasn't been loaded.
    // See https://stenciljs.com/docs/reactive-data#watch-decorator
    if (!this.stateMap.componentLoaded) {
      return;
    }

    this.stateMap.onStateChangeDisposable?.dispose();

    this.stateMap.onStateChangeDisposable = newController.onStateChange.on(
      (state) => this.handleControllerStateChange(state)
    );
  }

  private scheduleClearUnusedData(): void {
    if (this.stateMap.idleCallbackId != null) {
      window.cancelIdleCallback(this.stateMap.idleCallbackId);
    }

    this.stateMap.idleCallbackId = window.requestIdleCallback((foo) => {
      const remaining = foo.timeRemaining?.();

      if (remaining == null || remaining >= MIN_CLEAR_UNUSED_DATA_MS) {
        const [start, end] =
          this.controller.getPageIndexesForRange(
            this.stateMap.startIndex,
            this.stateMap.endIndex
          ) || [];

        if (start != null && end != null) {
          this.controller.invalidatePagesOutsideRange(start, end, 50);
        }
      } else {
        this.scheduleClearUnusedData();
      }
    });
  }

  private handleControllerStateChange(state: SceneTreeState): void {
    this.rows = state.rows;
    this.totalRows = state.totalRows;

    if (state.connection.type === 'failure') {
      this.connectionErrorDetails = state.connection.details;
    } else {
      this.connectionErrorDetails = undefined;
    }
  }

  private async performRowOperation(
    rowOrIndex: number | Row | Node.AsObject,
    op: OperationHandler
  ): Promise<void> {
    const row =
      typeof rowOrIndex === 'number' ? this.rows[rowOrIndex] : rowOrIndex;

    if (row == null) {
      throw new Error(`Cannot perform scene tree operation. Row not found.`);
    }

    const node = isLoadedRow(row) ? row.node : row;

    if (node.id == null) {
      throw new Error(`Cannot perform scene tree operation. ID is undefined.`);
    }

    if (this.viewer == null) {
      throw new Error(
        `Cannot perform scene tree operation. Cannot get reference to viewer.`
      );
    }

    await op({ viewer: this.viewer, id: node.id.hex, node });
  }

  private updateRenderState(): void {
    if (this.viewportHeight != null) {
      const rowHeight = this.getComputedOrPlaceholderRowHeight();
      const viewportCount = Math.ceil(this.viewportHeight / rowHeight);

      const viewportStartIndex = Math.floor(this.scrollTop / rowHeight);
      const viewportEndIndex = viewportStartIndex + viewportCount;

      const startIndex = Math.max(0, viewportStartIndex - this.overScanCount);
      const endIndex = Math.min(
        this.totalRows - 1,
        viewportEndIndex + this.overScanCount
      );

      const rows = this.getViewportRows(startIndex, endIndex);

      const diff = startIndex - this.stateMap.startIndex;
      if (diff > 0) {
        this.stateMap.elementPool?.swapHeadToTail(diff);
      } else {
        this.stateMap.elementPool?.swapTailToHead(-diff);
      }

      this.stateMap.startIndex = startIndex;
      this.stateMap.endIndex = endIndex;
      this.stateMap.viewportRows = rows;
    }
  }

  private getViewportRows(startIndex: number, endIndex: number): Row[] {
    const rows = this.rows.slice(startIndex, endIndex + 1);
    return rows.map((row) => (row != null ? this.populateRowData(row) : row));
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

  private async computeRowHeight(): Promise<void> {
    if (this.isComputingRowHeight) {
      const dummyData: LoadedRow = {
        index: 0,
        node: {
          id: { hex: '' },
          name: 'Dummy row',
          expanded: false,
          selected: false,
          visible: false,
          isLeaf: false,
          depth: 0,
        },
        data: {},
      };
      const { bindings, element } = this.createInstancedTemplate();
      bindings.bind(dummyData);
      element.style.visibility = 'hidden';

      this.el.shadowRoot?.appendChild(element);

      /* eslint-disable @typescript-eslint/no-explicit-any */
      if (typeof (element as any).componentOnReady === 'function') {
        await (element as any).componentOnReady();
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */

      let height = element.clientHeight;
      let attempts = 0;

      while (height === 0 && attempts < 10) {
        height = await new Promise((resolve) => {
          setTimeout(() => resolve(element.getBoundingClientRect().height), 5);
        });
        attempts = attempts + 1;
      }
      this.computedRowHeight = height;
      element.remove();
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

  private ensureTemplateDefined(): void {
    let template = this.el.querySelector('template');
    if (template == null) {
      template = document.createElement('template');
      template.innerHTML = `
      <vertex-scene-tree-row prop:node="{{row.node}}"></vertex-scene-tree-row>
      `;
      this.el.appendChild(template);
    }
    this.stateMap.template = template;
  }

  private createInstancedTemplate(): InstancedTemplate<HTMLElement> {
    if (this.stateMap.template != null) {
      return generateInstanceFromTemplate(this.stateMap.template);
    } else {
      throw new Error('No template defined for scene tree.');
    }
  }

  private createPool(): void {
    const container = this.el.shadowRoot?.querySelector('.rows');

    if (this.viewportHeight == null) {
      throw new Error('Viewport height is not defined');
    }

    if (container == null) {
      throw new Error(
        'Cannot create scene tree pool. Row container cannot be found'
      );
    }

    // When doing a live reload, this function might get called multiple times.
    // Only create the pool if on hasn't been created yet.
    if (this.stateMap.elementPool == null) {
      this.stateMap.elementPool = new ElementPool(this.el, () =>
        this.createInstancedTemplate()
      );
    }
  }

  private async updateElements(): Promise<void> {
    this.updatePool();
    this.bindData();
    this.positionElements();
  }

  private updatePool(): void {
    const count = this.stateMap.endIndex - this.stateMap.startIndex + 1;
    this.stateMap.elementPool?.updateElements(count);
  }

  private bindData(): void {
    this.stateMap.elementPool?.iterateElements((el, binding, i) => {
      const row = this.stateMap.viewportRows[i];
      if (row != null) {
        el.style.visibility = 'inherit';
        binding.bind(row);
      } else {
        el.style.visibility = 'hidden';
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).tree = this;
    });
  }

  private positionElements(): void {
    const rowHeight = this.getComputedOrPlaceholderRowHeight();
    this.stateMap.elementPool?.iterateElements((el, _, i) => {
      el.style.position = 'absolute';
      el.style.top = `${rowHeight * (this.stateMap.startIndex + i)}px`;
      el.style.height = `${rowHeight}px`;
    });
  }

  private updateViewportHeight(): void {
    this.viewportHeight = getSceneTreeViewportHeight(this.el);
  }
}
