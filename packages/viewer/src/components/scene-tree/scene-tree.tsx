import 'requestidlecallback-polyfill';
import {
  Component,
  Element,
  forceUpdate,
  h,
  Host,
  Method,
  Prop,
  readTask,
  State,
  Watch,
} from '@stencil/core';
import { Row } from './lib/row';
import { CollectionBinding, generateBindings } from './lib/binding';
import { SceneTreeController, SceneTreeState } from './lib/controller';
import { ConnectionStatus } from '../viewer/viewer';
import { Config, parseConfig } from '../../config/config';
import { Environment } from '../../config/environment';
import { SceneTreeAPIClient } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';
import { Disposable } from '@vertexvis/utils';
import { getSceneTreeViewportHeight } from './lib/dom';

// eslint-disable-next-line @typescript-eslint/ban-types
export type RowDataProvider = (row: Row) => object;

/**
 * The minimum amount of time provided by requestIdleCallback to clear purged
 * data. A value too low may cause contention with browser rendering. A value
 * too high will cause too many items to be accumulated.
 */
const MIN_CLEAR_UNUSED_DATA_MS = 10;

@Component({
  tag: 'vertex-scene-tree',
  styleUrl: 'scene-tree.css',
  shadow: true,
})
export class SceneTree {
  @Prop()
  public approximateItemHeight = 20;

  @Prop()
  public overScanCount = 10;

  @Prop()
  public viewerSelector?: string;

  @Prop({ reflect: true, mutable: true })
  public viewer: HTMLVertexViewerElement | undefined;

  @Prop()
  public rowData?: RowDataProvider;

  @Prop()
  public config?: Config;

  /**
   * Sets the default environment for the viewer. This setting is used for
   * auto-configuring network hosts.
   *
   * Use the `config` property for manually setting hosts.
   */
  @Prop() public configEnv: Environment = 'platprod';

  @Prop({ reflect: true, mutable: true })
  public jwt: string | undefined;

  @Element()
  private el!: HTMLElement;

  @State()
  private startIndex = 0;

  @State()
  private viewportHeight: number | undefined;

  @State()
  private viewportItems: Row[] = [];

  @State()
  private isComputingItemHeight = true;

  @State()
  private rows: Row[] = [];

  @State()
  private totalRows = 0;

  @State()
  private scrollTop = 0;

  private computedItemHeight: number | undefined;

  private leftTemplate: HTMLTemplateElement | undefined;
  private rightTemplate: HTMLTemplateElement | undefined;
  private bindings = new Map<Element, CollectionBinding>();

  private idleCallbackId: number | undefined;

  private connected = false;

  private onStateChangeDisposable: Disposable | undefined;
  private subscribeDisposable: Disposable | undefined;

  /**
   * @private Used for internal testing.
   */
  public client!: SceneTreeAPIClient;

  /* eslint-disable lines-between-class-members */
  private _controller: SceneTreeController | undefined;
  /**
   * @private Used for internal testing
   */
  public get controller(): SceneTreeController | undefined {
    return this._controller;
  }
  /**
   * @private Used for internal testing
   */
  public set controller(value: SceneTreeController | undefined) {
    if (this.controller == null) {
      this.cleanupController();
    }

    this._controller = value;

    if (this.controller != null) {
      this.connectController(this.controller);
    }
  }
  /* eslint-enable lines-between-class-members */

  public componentWillLoad(): void {
    if (this.viewerSelector != null) {
      this.viewer = document.querySelector(this.viewerSelector) as
        | HTMLVertexViewerElement
        | undefined;
    }

    const { sceneTreeHost } = this.getConfig().network;
    this.client = new SceneTreeAPIClient(sceneTreeHost);
  }

  public async componentDidLoad(): Promise<void> {
    this.el.addEventListener('scroll', () => this.handleScroll());

    this.leftTemplate =
      (this.el.querySelector('template[slot="left"]') as HTMLTemplateElement) ||
      undefined;

    this.rightTemplate =
      (this.el.querySelector(
        'template[slot="right"]'
      ) as HTMLTemplateElement) || undefined;

    readTask(() => {
      this.viewportHeight = getSceneTreeViewportHeight(this.el);
      this.updateRenderState();
    });
  }

  public componentWillRender(): void {
    this.updateRenderState();
    this.loadMoreRowsIfNeeded();
  }

  public componentDidRender(): void {
    this.cleanupBindings();
    this.computeRowHeight();
  }

  public render(): h.JSX.IntrinsicElements {
    const itemHeight = this.getComputedOrPlaceholderRowHeight();
    const totalHeight = this.totalRows * itemHeight;
    const startY = this.startIndex * itemHeight;
    return (
      <Host>
        <div class="rows" style={{ height: `${totalHeight}px` }}>
          {this.isComputingItemHeight ? (
            <div class="row" />
          ) : (
            this.viewportItems.map((row, i) => {
              if (row == null) {
                return <div class="row"></div>;
              } else {
                return (
                  <div
                    class="row"
                    style={{ top: `${startY + itemHeight * i}px` }}
                  >
                    <span
                      ref={(el) => {
                        if (el != null && this.leftTemplate != null) {
                          this.populateSlot(this.leftTemplate, row, el);
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
                      onClick={() => this.toggleExpansion(row)}
                    >
                      {!row.isLeaf && row.expanded && '▾'}
                      {!row.isLeaf && !row.expanded && '▸'}
                    </span>
                    <span class="row-text" title={row.name}>
                      {row.name}
                    </span>
                    <span
                      ref={(el) => {
                        if (el != null && this.rightTemplate != null) {
                          this.populateSlot(this.rightTemplate, row, el);
                        }
                      }}
                    />
                  </div>
                );
              }
            })
          )}
        </div>
      </Host>
    );
  }

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

  @Method()
  public async scrollToIndex(index: number): Promise<void> {
    // TODO(dan): Add alignment to top, center, or bottom.
    const i = Math.max(0, Math.min(index, this.totalRows));

    if (this.computedItemHeight != null) {
      const top = i * this.computedItemHeight;
      this.el.scrollTo({ top, behavior: 'smooth' });
    }
  }

  @Method()
  public async expandAll(): Promise<void> {
    if (this.jwt != null) {
      await this.controller?.expandAll(this.jwt);
    } else {
      throw new Error('Cannot expand all nodes. Token is undefined.');
    }
  }

  @Method()
  public async collapseAll(): Promise<void> {
    if (this.jwt != null) {
      await this.controller?.collapseAll(this.jwt);
    } else {
      throw new Error('Cannot collapse all nodes. Token is undefined.');
    }
  }

  @Watch('viewer')
  public async handleViewerChanged(
    newViewer: HTMLVertexViewerElement | undefined,
    oldViewer: HTMLVertexViewerElement | undefined
  ): Promise<void> {
    if (oldViewer != null) {
      this.controller = undefined;

      oldViewer.removeEventListener('sceneReady', this.handleViewerSceneReady);
      oldViewer.removeEventListener(
        'connectionChange',
        this.handleViewerConnectionStatusChange
      );
    }

    if (newViewer != null) {
      newViewer.addEventListener('sceneReady', this.handleViewerSceneReady);
      newViewer.addEventListener(
        'connectionChange',
        this.handleViewerConnectionStatusChange
      );

      const isSceneReady = await newViewer.isSceneReady();
      if (isSceneReady) {
        this.jwt = await newViewer.getJwt();
        this.createController();
      }
    }
  }

  @Watch('controller')
  public handleControllerChanged(
    newController: SceneTreeController | undefined,
    oldController: SceneTreeController | undefined
  ): void {
    if (oldController != null) {
      this.cleanupController();
    }

    if (newController != null) {
      this.connectController(newController);
    }
  }

  @Watch('jwt')
  public handleJwtChanged(): void {
    if (this.controller != null) {
      this.connectController(this.controller);
    }
  }

  private handleViewerSceneReady = (): void => {
    console.debug('Scene tree received viewer scene ready');
    this.createController();
  };

  private async createController(): Promise<void> {
    this.controller = new SceneTreeController(this.client, 100);
  }

  private cleanupController(): void {
    this.onStateChangeDisposable?.dispose();
    this.subscribeDisposable?.dispose();
  }

  private connectController(controller: SceneTreeController): void {
    if (this.jwt != null && !this.connected) {
      this.onStateChangeDisposable = controller.onStateChange.on((state) => {
        this.handleControllerStateChange(state);
        this.scheduleClearUnusedData();
      });
      this.subscribeDisposable = controller.subscribe(() => {
        if (this.jwt != null) {
          return this.jwt;
        } else {
          throw new Error('Cannot update subscription. JWT is null.');
        }
      });
      controller.fetchPage(0, this.jwt);
      this.connected = true;
    }
  }

  private scheduleClearUnusedData(): void {
    if (this.idleCallbackId != null) {
      window.cancelIdleCallback(this.idleCallbackId);
    }

    if (this.controller != null) {
      this.idleCallbackId = window.requestIdleCallback((foo) => {
        const remaining = foo.timeRemaining?.();

        if (remaining == null || remaining >= MIN_CLEAR_UNUSED_DATA_MS) {
          const [start, end] =
            this.controller?.getPageIndexesForRange(
              this.startIndex,
              this.startIndex + this.viewportItems.length
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

  private toggleExpansion(row: Row): void {
    if (row != null && this.jwt) {
      if (row.expanded) {
        this.controller?.collapseNode(row.id, this.jwt);
      } else {
        this.controller?.expandNode(row.id, this.jwt);
      }
    }
  }

  private updateRenderState(): void {
    if (this.viewportHeight != null) {
      const itemHeight = this.getComputedOrPlaceholderRowHeight();
      const viewportCount = Math.ceil(this.viewportHeight / itemHeight);
      const start = Math.max(
        0,
        Math.floor(this.scrollTop / itemHeight) - this.overScanCount
      );
      const end = Math.min(
        this.totalRows,
        start + viewportCount + this.overScanCount * 2
      );

      this.startIndex = start;
      const items = this.getViewportRows(start, end).map((row) =>
        this.populateRowData(row)
      );
      this.viewportItems = items;
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
      let binding = this.bindings.get(el);
      if (binding == null) {
        binding = new CollectionBinding(generateBindings(el.firstElementChild));
        this.bindings.set(el, binding);
      }
      binding.bind(row);
    }
  }

  private handleScroll(): void {
    readTask(() => {
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

  private async loadMoreRowsIfNeeded(): Promise<void> {
    if (this.jwt != null && this.controller != null) {
      const [start, end] = this.controller.getPageIndexesForRange(
        this.startIndex,
        this.startIndex + this.viewportItems.length
      );
      const unloadedPages = this.controller.getNonLoadedPageIndexes(start, end);
      for (const page of unloadedPages.slice(0, 1)) {
        this.controller.fetchPage(page, this.jwt);
      }
    }
  }

  private cleanupBindings(): void {
    for (const key of this.bindings.keys()) {
      if (key.parentElement == null) {
        this.bindings.delete(key);
      }
    }
  }

  private computeRowHeight(): void {
    if (this.isComputingItemHeight) {
      // Set the state on the next event tick to prevent a warning from
      // StencilJS.
      setTimeout(() => {
        const rowEl = this.el.shadowRoot?.querySelector('.row');
        this.computedItemHeight = rowEl?.clientHeight;
        this.isComputingItemHeight = false;
      }, 0);
    }
  }

  private getComputedOrPlaceholderRowHeight(): number {
    return this.computedItemHeight || 24;
  }

  private getConfig(): Config {
    return parseConfig(this.configEnv, this.config);
  }
}
