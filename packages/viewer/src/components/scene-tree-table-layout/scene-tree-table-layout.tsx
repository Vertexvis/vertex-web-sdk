import { Component, Host, h, Prop, State, Element } from '@stencil/core';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import { readDOM } from '../../lib/stencil';
import { Binding } from '../scene-tree/lib/binding';
import { SceneTreeController } from '../scene-tree/lib/controller';
import { getSceneTreeViewportHeight } from '../scene-tree/lib/dom';
import { ElementPool } from '../scene-tree/lib/element-pool';
import { LoadedRow, Row } from '../scene-tree/lib/row';
import {
  generateInstanceFromTemplate,
  InstancedTemplate,
} from '../scene-tree/lib/templates';
import { RowDataProvider } from '../scene-tree/scene-tree';
import { getSceneTreeTableOffsetTop } from './lib/dom';

interface StateMap {
  columnElementPools?: WeakMap<
    HTMLVertexSceneTreeTableColumnElement,
    ElementPool
  >;
  headerInstances?: Array<InstancedTemplate<HTMLElement>>;

  viewportRows: Row[];
}

@Component({
  tag: 'vertex-scene-tree-table-layout',
  styleUrl: 'scene-tree-table-layout.css',
  shadow: true,
})
export class SceneTreeTableLayout {
  /**
   * A reference to the scene tree to perform operations for interactions. Such
   * as expansion, visibility and selection.
   */
  @Prop()
  public tree?: HTMLVertexSceneTreeElement;

  /**
   * @internal
   */
  @Prop()
  public controller?: SceneTreeController;

  /**
   * @internal
   */
  @Prop()
  public rows: Row[] = [];

  /**
   * @internal
   */
  @Prop()
  public totalRows = 0;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public rowHeight = 24;

  /**
   * The number of offscreen rows above and below the viewport to render. Having
   * a higher number reduces the chance of the browser not displaying a row
   * while scrolling.
   *
   * This prop will be automatically populated based on the `overScanCount` prop
   * specified in the parent `<vertex-scene-tree />` element.
   */
  @Prop()
  public overScanCount = 25;

  /**
   * A callback that is invoked immediately before a row is about to rendered.
   * This callback can return additional data that can be bound to in a
   * template.
   *
   * This prop will be automatically populated based on the `rowData` prop
   * specified in the parent `<vertex-scene-tree />` element.
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
   * @internal
   */
  @Prop({ mutable: true })
  public layoutOffset = 0;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public scrollOffset = 0;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public layoutHeight?: number;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public viewportStartIndex = 0;

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public viewportEndIndex = 0;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private columnGridLayout = '1fr';

  @State()
  private hoveredNodeId?: string;

  @State()
  private isComputingCellHeight = true;

  /**
   * This stores internal state that you want to preserve across live-reloads,
   * but shouldn't trigger a refresh if the data changes. Marking this with
   * @State to allow to preserve state across live-reloads.
   */
  @State()
  private stateMap: StateMap = {
    viewportRows: [],
  };

  private lastStartIndex = 0;
  private resizeObserver?: ResizeObserver;

  private tableElement?: HTMLDivElement;
  private headerElement?: HTMLDivElement;
  private columnElements: HTMLVertexSceneTreeTableColumnElement[] = [];

  public componentWillLoad(): void {
    this.updateColumnElements();
    this.computeColumnGridLayout();
    this.createPools();

    this.columnElements.forEach((c) => {
      c.addEventListener('hovered', this.handleCellHover as EventListener);
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.updateLayoutPosition();
      this.clearLayoutHeight();
    });
    this.resizeObserver.observe(this.hostEl);
  }

  public componentDidLoad(): void {
    this.computeCellHeight();
    this.bindHeaderData();

    this.tableElement?.addEventListener('scroll', this.handleScrollChanged, {
      passive: true,
    });
  }

  public async componentWillRender(): Promise<void> {
    this.computeViewportRows();

    if (this.controller?.isConnected) {
      await this.controller.updateActiveRowRange(
        this.viewportStartIndex,
        this.viewportEndIndex
      );
    }
  }

  public componentDidRender(): void {
    this.layoutColumns();
  }

  public disconnectedCallback(): void {
    this.columnElements.forEach((c) => {
      c.removeEventListener('hovered', this.handleCellHover as EventListener);
    });
    this.tableElement?.removeEventListener('scroll', this.handleScrollChanged);
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div
          class="header"
          ref={(ref) => (this.headerElement = ref)}
          style={{
            gridTemplateColumns: this.columnGridLayout,
          }}
        />
        <div
          class="table"
          ref={(ref) => (this.tableElement = ref)}
          style={{
            gridTemplateColumns: this.columnGridLayout,
          }}
        >
          <slot onSlotchange={this.bindHeaderData} />
        </div>
      </Host>
    );
  }

  private computeViewportRows(): void {
    const viewportHeight = this.getLayoutHeight();
    if (viewportHeight != null) {
      const viewportCount = Math.ceil(viewportHeight / this.rowHeight);

      const viewportStartIndex = Math.floor(this.scrollOffset / this.rowHeight);
      const viewportEndIndex = viewportStartIndex + viewportCount;

      const startIndex = Math.max(0, viewportStartIndex - this.overScanCount);
      const endIndex = Math.min(
        this.totalRows - 1,
        viewportEndIndex + this.overScanCount
      );

      const rows = this.getViewportRows(startIndex, endIndex);

      this.viewportStartIndex = startIndex;
      this.viewportEndIndex = endIndex;
      this.stateMap.viewportRows = rows;
    }
  }

  private layoutColumns = (): void => {
    const visibleRowCount = this.viewportEndIndex - this.viewportStartIndex + 1;
    const diff = this.viewportStartIndex - this.lastStartIndex;
    this.lastStartIndex = this.viewportStartIndex;

    this.iterateColumns((col, pool) => {
      pool.updateElements(visibleRowCount);

      if (diff > 0) {
        pool.swapHeadToTail(diff);
      } else {
        pool.swapTailToHead(-diff);
      }

      col.style.minHeight = `${this.rowHeight * this.totalRows}px`;

      pool.iterateElements((el, binding, rowIndex) => {
        const row = this.stateMap.viewportRows[rowIndex];
        if (row != null) {
          this.updateCell(row, el, binding, rowIndex);
        }
      });
    });
  };

  private updateCell = (
    row: LoadedRow,
    cell: HTMLElement,
    binding: Binding,
    rowIndex: number
  ): void => {
    cell.style.position = 'absolute';
    cell.style.top = `${
      (this.viewportStartIndex + rowIndex) * this.rowHeight
    }px`;
    cell.style.height = `${this.rowHeight}px`;
    cell.style.width = '100%';

    /* eslint-disable @typescript-eslint/no-explicit-any */
    (cell as any).tree = this.tree;
    (cell as any).node = row.node;
    (cell as any).hoveredNodeId = this.hoveredNodeId;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    binding.bind(row);
  };

  private updateLayoutPosition = (): void => {
    readDOM(() => {
      if (this.tableElement != null) {
        this.layoutOffset = getSceneTreeTableOffsetTop(this.tableElement);
      }
    });
  };

  private updateColumnElements = (): void => {
    this.columnElements = Array.from(
      this.hostEl.querySelectorAll('vertex-scene-tree-table-column')
    ) as Array<HTMLVertexSceneTreeTableColumnElement>;
  };

  private createPools(): void {
    if (this.stateMap.columnElementPools == null) {
      this.stateMap.columnElementPools = this.columnElements.reduce(
        (map, c) =>
          map.set(
            c,
            new ElementPool(c, () => this.createColumnCellInstance(c))
          ),
        new WeakMap()
      );
    }
  }

  private iterateColumns(
    f: (
      column: HTMLVertexSceneTreeTableColumnElement,
      pool: ElementPool,
      index: number
    ) => void
  ): void {
    this.columnElements.forEach((column, i) => {
      const pool = this.stateMap.columnElementPools?.get(column);
      if (pool != null) {
        f(column, pool, i);
      } else {
        throw new Error('Cannot find pool for column');
      }
    });
  }

  private createHeaderInstance(
    column: HTMLVertexSceneTreeTableColumnElement
  ): InstancedTemplate<HTMLElement> | undefined {
    const template = column.querySelector(
      'template[slot="header"]'
    ) as HTMLTemplateElement;
    if (template != null) {
      return generateInstanceFromTemplate(template);
    }
  }

  private createColumnCellInstance(
    column: HTMLVertexSceneTreeTableColumnElement
  ): InstancedTemplate<HTMLElement> {
    const template = column.querySelector(
      'template:not([slot="header"])'
    ) as HTMLTemplateElement;
    if (template != null) {
      return generateInstanceFromTemplate(template);
    } else {
      throw new Error('Column is missing cell template element');
    }
  }

  private computeCellHeight = async (): Promise<void> => {
    if (this.isComputingCellHeight && this.columnElements.length > 0) {
      const dummyData: LoadedRow = {
        index: 0,
        node: {
          id: { hex: '' },
          name: 'Dummy row',
          expanded: false,
          selected: false,
          visible: false,
          partiallyVisible: false,
          isLeaf: false,
          depth: 0,
          columnsList: [],
        },
        metadata: {},
        data: {},
      };
      const { bindings, element } = this.createColumnCellInstance(
        this.columnElements[0]
      );
      bindings.bind(dummyData);
      element.style.visibility = 'hidden';

      this.columnElements[0]?.appendChild(element);

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
      this.rowHeight = height ?? this.rowHeight;
      element.remove();
      this.isComputingCellHeight = false;
    }
  };

  private computeColumnGridLayout = (): void => {
    this.columnGridLayout = `${this.columnElements
      .map((c) => c.initialWidth)
      .slice(0, -1)
      .reduce((res, w) => `${res} ${w}px`, '')} 1fr`;
  };

  private handleCellHover = (
    event: CustomEvent<Node.AsObject | undefined>
  ): void => {
    this.hoveredNodeId = event.detail?.id?.hex;
  };

  private bindHeaderData = (): void => {
    if (this.stateMap.headerInstances == null) {
      this.stateMap.headerInstances = this.columnElements
        .map((c, i) => {
          const instance = this.createHeaderInstance(c);

          if (instance != null) {
            instance.element.style.gridColumnStart = `${i + 1}`;
            instance.element.style.gridColumnEnd = `${i + 2}`;
            this.headerElement?.appendChild(instance.element);
          }

          return instance;
        })
        .filter((i) => i != null) as Array<InstancedTemplate<HTMLElement>>;
    }
  };

  private handleScrollChanged = (event: Event): void => {
    this.scrollOffset = (event.target as HTMLElement).scrollTop;
  };

  private getViewportRows(startIndex: number, endIndex: number): Row[] {
    const rows = this.rows.slice(startIndex, endIndex + 1);
    return rows.map((row) => (row != null ? this.populateRowData(row) : row));
  }

  private populateRowData(row: Row): Row {
    if (this.rowData != null && row != null) {
      const data = this.rowData?.(row) || {};
      return { ...row, data };
    } else {
      return row;
    }
  }

  private getLayoutHeight(): number | undefined {
    if (this.layoutHeight == null && this.tableElement != null) {
      this.layoutHeight = getSceneTreeViewportHeight(this.tableElement);
    }
    return this.layoutHeight;
  }

  private clearLayoutHeight(): void {
    this.layoutHeight = undefined;
  }
}
