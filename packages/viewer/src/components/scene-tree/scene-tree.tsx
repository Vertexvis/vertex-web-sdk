import 'requestidlecallback-polyfill';
import {
  Component,
  Element,
  h,
  Host,
  Method,
  Prop,
  readTask,
  State,
} from '@stencil/core';
import { Row } from '../../scene-tree';
import { CollectionBinding, generateBindings } from './lib/binding';
import {
  SceneTreeController,
  SceneTreeState,
} from '../../scene-tree/controller';
import { ConnectionStatus } from '../viewer/viewer';
import { Config, parseConfig } from '../../config/config';
import { Environment } from '../../config/environment';
import { SceneTreeAPIClient } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';

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

  @Prop()
  public config?: Config;

  /**
   * Sets the default environment for the viewer. This setting is used for
   * auto-configuring network hosts.
   *
   * Use the `config` property for manually setting hosts.
   */
  @Prop() public configEnv: Environment = 'platprod';

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

  private controller: SceneTreeController | undefined;
  private idleCallbackId: number | undefined;

  // TODO(dan): Consider pulling these out into a context object that can be
  // shared between components.
  private sceneViewId: string | undefined;
  private jwt: string | undefined;

  @Prop()
  public rowData: RowDataProvider = () => ({});

  public componentWillLoad(): void {
    if (this.viewerSelector) {
      const viewer = document.querySelector(this.viewerSelector) as
        | HTMLVertexViewerElement
        | undefined;

      if (viewer != null) {
        viewer.addEventListener('sceneReady', async () => {
          const scene = await viewer.scene();
          const jwt = await viewer.getJwt();

          if (jwt != null) {
            this.handleViewerSceneReady(scene.sceneViewId, jwt);
          }
        });
        viewer.addEventListener('connectionChange', (event) =>
          this.handleViewerConnectionStatusChanged(
            event as CustomEvent<ConnectionStatus>
          )
        );
      }
    }
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
      this.viewportHeight = this.el.clientHeight;
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

  @Method()
  public async invalidateRows(): Promise<void> {
    readTask(() => {
      this.scrollTop = this.el.scrollTop || 0;
    });
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
    }
  }

  private handleViewerSceneReady(sceneViewId: string, jwt: string): void {
    this.jwt = jwt;

    console.debug('Scene tree received viewer scene ready', sceneViewId);

    if (this.sceneViewId !== sceneViewId) {
      const { sceneTreeHost } = this.getConfig().network;
      const client = new SceneTreeAPIClient(sceneTreeHost);
      this.controller = new SceneTreeController(client, sceneViewId, 100);
      this.controller.onStateChange.on((state) => {
        this.handleControllerStateChange(state);
        this.scheduleClearUnusedData();
      });
      this.controller.fetchPage(0, jwt);
      this.controller.subscribe(() => {
        if (this.jwt != null) {
          return this.jwt;
        } else {
          throw new Error('Cannot update subscription. JWT is null.');
        }
      });
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

  private handleViewerConnectionStatusChanged(
    event: CustomEvent<ConnectionStatus>
  ): void {
    const { detail } = event;
    if (detail.status === 'connected') {
      console.debug('Scene tree received new token');
      this.jwt = detail.jwt;
    }
  }

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
      this.viewportItems = this.getViewportRows(start, end).map((row) =>
        this.populateRowData(row)
      );
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
    this.invalidateRows();
  }

  private populateRowData(row: Row): Row {
    if (this.rowData != null && row != null) {
      const data = this.rowData(row);
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
      const unloadedPages = this.controller.getNonLoadedPageIndexes(
        start - 3,
        end + 3
      );
      for (const page of unloadedPages) {
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
