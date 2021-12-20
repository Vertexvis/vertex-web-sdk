import 'requestidlecallback-polyfill';
import {
  Component,
  Element,
  Event,
  EventEmitter,
  forceUpdate,
  h,
  Host,
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { SceneTreeAPIClient } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { Disposable } from '@vertexvis/utils';
import { isLoadedRow, Row } from './lib/row';
import {
  FilterTreeOptions,
  SceneTreeController,
  SceneTreeState,
} from './lib/controller';
import { Config, parseConfig } from '../../lib/config';
import { Environment } from '../../lib/environment';
import { getSceneTreeContainsElement } from './lib/dom';
import {
  deselectItem,
  hideItem,
  selectItem,
  ViewerSelectItemOptions,
  showItem,
} from './lib/viewer-ops';
import { SceneTreeErrorDetails } from './lib/errors';
import { MetadataKey } from './interfaces';
import { isSceneTreeTableCellElement } from '../scene-tree-table-cell/utils';
import { ElementPool } from '@vertexvis/html-templates';

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

  selectionPath?: string[];

  layoutEl?: HTMLVertexSceneTreeTableLayoutElement;
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

/**
 * A set of options to configure selection behavior.
 */
export interface SelectItemOptions extends ViewerSelectItemOptions {
  /**
   * Specifies that the next deselected ancestor node should be selected.
   */
  recurseParent?: boolean;
}

/**
 * @slot header - A slot that places content above the rows in the tree. By
 *  default, a search toolbar will be placed in this slot. Elements can be
 *  stacked by assigning multiple elements to this slot.
 * @slot footer - A slot that places content below the rows in the tree.
 * Elements can be stacked by assigning multiple elements to this slot.
 */
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
   *   const table = document.querySelector('vertex-scene-tree-table');
   *   table.rowData = (row) => {
   *     return { func: () => console.log('row', row.node.name) };
   *   }
   * </script>
   *
   * <vertex-scene-tree>
   *  <vertex-scene-tree-table>
   *    <vertex-scene-tree-table-column>
   *      <template>
   *        <button event:click="{{row.data.func}}">Hi</button>
   *      </template>
   *    </vertex-scene-tree-table-column>
   *  </vertex-scene-tree-table>
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

  @Prop({ mutable: true })
  public controller?: SceneTreeController;

  /**
   * A list of part metadata keys that will be made available to each row. This
   * metadata can be used for data binding inside the scene tree's template.
   */
  @Prop()
  public metadataKeys: MetadataKey[] = [];

  @Event()
  public connectionError!: EventEmitter<SceneTreeErrorDetails>;

  @State()
  private rows: Row[] = [];

  @State()
  private totalRows = 0;

  /**
   * This stores internal state that you want to preserve across live-reloads,
   * but shouldn't trigger a refresh if the data changes. Marking this with
   * @State to allow to preserve state across live-reloads.
   */
  @State()
  private stateMap: StateMap = {
    componentLoaded: false,
  };

  @State()
  private connectionErrorDetails: SceneTreeErrorDetails | undefined;

  @Element()
  private el!: HTMLElement;

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
    forceUpdate(this.getLayoutElement());
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

    this.getLayoutElement().scrollToPosition(top, {
      behavior: animate ? 'smooth' : undefined,
    });
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
    const rowsBeforeExpand = this.totalRows;
    const index = await this.controller?.expandParentNodes(itemId);

    if (index != null && rowsBeforeExpand !== this.totalRows) {
      return new Promise((resolve) => {
        const layoutEl = this.getLayoutElement();
        const handleLayoutRendered = async (): Promise<void> => {
          layoutEl.removeEventListener('layoutRendered', handleLayoutRendered);
          await this.scrollToIndex(index, options);
          resolve();
        };

        layoutEl.addEventListener('layoutRendered', handleLayoutRendered);
      });
    } else if (index != null) {
      await this.scrollToIndex(index, options);
    }
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
   * @param row A row, row index, or node to expand.
   */
  @Method()
  public async expandItem(row: RowArg): Promise<void> {
    await this.performRowOperation(row, async ({ id, node }) => {
      if (!node.expanded) {
        await this.controller?.expandNode(id);
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
        await this.controller?.collapseNode(id);
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
   * This method supports a `recurseParent` option that allows for recursively
   * selecting the next unselected parent node. This behavior is considered
   * stateful. Each call to `selectItem` will track the ancestry of the passed
   * in `rowArg`. If calling `selectItem` with a row not belonging to the
   * ancestry of a previous selection, then this method will perform a standard
   * selection.
   *
   * @param row The row, row index or node to select.
   * @param options A set of options to configure selection behavior.
   */
  @Method()
  public async selectItem(
    row: RowArg,
    { recurseParent, ...options }: SelectItemOptions = {}
  ): Promise<void> {
    await this.performRowOperation(row, async ({ viewer, id }) => {
      const ancestors = (await this.controller?.fetchNodeAncestors(id)) || [];
      const isInPath = this.stateMap.selectionPath?.includes(id);

      if (recurseParent && isInPath) {
        const nextNode = ancestors.find(({ selected }) => !selected);
        if (nextNode != null) {
          await this.selectItem(nextNode, options);
        }
      } else {
        await selectItem(viewer, id, options);
      }

      this.stateMap.selectionPath = [
        ...ancestors.map(({ id }) => id?.hex || ''),
        id,
      ];
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
   * Returns the row data from the given mouse or pointer event. The event must
   * originate from a `vertex-scene-tree-table-cell` contained by this element,
   * otherwise `undefined` is returned.
   *
   * @param event A mouse or pointer event that originated from this component.
   * @returns A row, or `undefined` if the row hasn't been loaded.
   */
  @Method()
  public async getRowForEvent(event: MouseEvent | PointerEvent): Promise<Row> {
    const { clientY, target } = event;

    if (
      target != null &&
      this.connectionErrorDetails == null &&
      getSceneTreeContainsElement(this.el, target as HTMLElement) &&
      isSceneTreeTableCellElement(target)
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
    const layoutEl = this.getLayoutElement();
    const top = layoutEl.layoutOffset;
    const index = Math.floor(
      (clientY - top + layoutEl.scrollOffset) / layoutEl.rowHeight
    );
    return this.getRowAtIndex(index);
  }

  /**
   * Performs an async request that will filter the displayed items in the tree
   * that match the given term and options.
   *
   * @param term The filter term.
   * @param options The options to apply to the filter.
   * @returns A promise that completes when the request has completed. Note,
   *  items are displayed asynchronously. So the displayed items may not reflect
   *  the result of this filter when the promise completes.
   */
  @Method()
  public async filterItems(
    term: string,
    options: FilterTreeOptions = {}
  ): Promise<void> {
    return this.controller?.filter(term, options);
  }

  /**
   * Fetches the metadata keys that are available to the scene tree. Metadata
   * keys can be assigned to the scene tree using the `metadataKeys` property.
   * The scene tree will fetch this metadata and make these values available
   * for data binding.
   *
   * @returns A promise that resolves with the names of available keys.
   */
  @Method()
  public async fetchMetadataKeys(): Promise<MetadataKey[]> {
    return this.controller?.fetchMetadataKeys() ?? [];
  }

  /**
   * @ignore
   */
  protected disconnectedCallback(): void {
    this.stateMap.viewerDisposable?.dispose();
  }

  /**
   * @ignore
   */
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
    }

    this.stateMap.onStateChangeDisposable = this.controller.onStateChange.on(
      (state) => this.handleControllerStateChange(state)
    );

    if (this.viewer != null) {
      this.stateMap.viewerDisposable = this.controller.connectToViewer(
        this.viewer
      );
    }
  }

  /**
   * @ignore
   */
  protected async componentDidLoad(): Promise<void> {
    this.ensureLayoutDefined();

    const layoutEl = this.getLayoutElement();
    const resizeObserver = new ResizeObserver(() => {
      this.invalidateRows();
    });
    resizeObserver.observe(layoutEl);
    this.stateMap.resizeObserver = resizeObserver;

    this.stateMap.componentLoaded = true;

    this.controller?.setMetadataKeys(this.metadataKeys);
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
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

        <div class="header">
          <slot name="header">
            <vertex-scene-tree-toolbar class="search-toolbar">
              <vertex-scene-tree-search />
            </vertex-scene-tree-toolbar>
          </slot>
        </div>

        <div class="rows-scroll">
          <slot />
        </div>

        <div class="footer">
          <slot name="footer" />
        </div>
      </Host>
    );
  }

  /**
   * @ignore
   */
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
      this.stateMap.viewerDisposable =
        this.controller?.connectToViewer(newViewer);
    }
  }

  /**
   * @ignore
   */
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

    newController.setMetadataKeys(this.metadataKeys);
  }

  /**
   * @ignore
   */
  @Watch('metadataKeys')
  protected handleMetadataKeysChanged(): void {
    this.controller?.setMetadataKeys(this.metadataKeys);
  }

  private scheduleClearUnusedData(): void {
    if (this.stateMap.idleCallbackId != null) {
      window.cancelIdleCallback(this.stateMap.idleCallbackId);
    }

    this.stateMap.idleCallbackId = window.requestIdleCallback((foo) => {
      const remaining = foo.timeRemaining?.();

      if (remaining == null || remaining >= MIN_CLEAR_UNUSED_DATA_MS) {
        const layoutEl = this.getLayoutElement();
        const startIndex = layoutEl.viewportStartIndex;
        const endIndex = layoutEl.viewportEndIndex;
        const [start, end] =
          this.controller?.getPageIndexesForRange(startIndex, endIndex) || [];

        if (start != null && end != null) {
          this.controller?.invalidatePagesOutsideRange(start, end, 50);
        }
      } else {
        this.scheduleClearUnusedData();
      }
    });
  }

  private handleControllerStateChange(state: SceneTreeState): void {
    this.rows = state.rows;
    this.totalRows = state.totalRows;
    this.updateLayoutElement();

    if (state.connection.type === 'failure') {
      this.connectionErrorDetails = state.connection.details;
      this.connectionError.emit(state.connection.details);
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

  @Listen('search')
  protected handleSearch(event: CustomEvent<string>): void {
    this.filterItems(event.detail);
  }

  private getScrollToPosition(
    index: number,
    position: ScrollToOptions['position']
  ): number {
    const layoutEl = this.getLayoutElement();
    const constrainedIndex = Math.max(0, Math.min(index, this.totalRows - 1));
    const viewportHeight = layoutEl.layoutHeight ?? 0;
    const rowHeight = layoutEl.rowHeight;

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

  private ensureLayoutDefined(): void {
    let layout = this.el.querySelector('vertex-scene-tree-table-layout');
    if (layout == null) {
      layout = document.createElement('vertex-scene-tree-table-layout');
      layout.innerHTML = `
      <vertex-scene-tree-table-column>
        <template>
          <vertex-scene-tree-table-cell prop:value="{{row.node.name}}" expand-toggle visibility-toggle>
            {{row.node.name}}
          </vertex-scene-tree-table-cell>
        </template>
      </vertex-scene-tree-table-column>
      `;

      this.el.appendChild(layout);
    }
    this.stateMap.layoutEl = layout;
  }

  private updateLayoutElement(): void {
    const layout = this.stateMap.layoutEl;
    if (layout != null) {
      layout.rows = this.rows;
      layout.tree = this.el as HTMLVertexSceneTreeElement;
      layout.totalRows = this.totalRows;
      layout.controller = this.controller;
      layout.rowData = this.rowData;
    }
  }

  private getLayoutElement(): HTMLVertexSceneTreeTableLayoutElement {
    if (this.stateMap.layoutEl != null) {
      return this.stateMap.layoutEl;
    } else {
      throw new Error('Layout element is undefined');
    }
  }
}
