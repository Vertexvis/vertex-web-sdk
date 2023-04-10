import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
} from '@stencil/core';
import { Point } from '@vertexvis/geometry';
import {
  Binding,
  ElementPool,
  generateInstanceFromTemplate,
  InstancedTemplate,
} from '@vertexvis/html-templates';

import { readDOM } from '../../lib/stencil';
import { RowDataProvider } from '../scene-tree/interfaces';
import { SceneTreeController } from '../scene-tree/lib/controller';
import { getSceneTreeViewportHeight } from '../scene-tree/lib/dom';
import { isLoadedRow, LoadedRow, Row } from '../scene-tree/lib/row';
import {
  DomScrollToOptions,
  getSceneTreeTableOffsetTop,
  getSceneTreeTableViewportWidth,
  scrollToTop,
} from './lib/dom';
import { SceneTreeCellHoverController } from './lib/hover-controller';
import { restartTimeout } from './lib/window';

interface StateMap {
  columnElementPools?: WeakMap<
    HTMLVertexSceneTreeTableColumnElement,
    ElementPool
  >;
  headerInstances?: Array<InstancedTemplate<HTMLElement>>;
  headerDividerInstances?: Array<InstancedTemplate<HTMLElement>>;
  headerDividerListeners?: Array<(event: PointerEvent) => void>;

  viewportRows: Row[];

  headerHeight?: number;
  columnWidths: number[];
  columnWidthPercentages: number[];
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
  public layoutWidth?: number;

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

  /**
   * @internal
   */
  @Event()
  public layoutRendered!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private columnGridLayout = '1fr';

  @State()
  private columnGridFixedLayout = '';

  @State()
  private isComputingCellHeight = true;

  @State()
  private lastDividerPointerPosition?: Point.Point;

  @State()
  private resizingColumnIndex?: number;

  @State()
  private isScrolling = false;

  @State()
  private scrollTimer: number | undefined;

  /**
   * This stores internal state that you want to preserve across live-reloads,
   * but shouldn't trigger a refresh if the data changes. Marking this with
   * @State to allow to preserve state across live-reloads.
   */
  @State()
  private stateMap: StateMap = {
    viewportRows: [],
    columnWidths: [],
    columnWidthPercentages: [],
  };

  private lastStartIndex = 0;
  private resizeObserver?: ResizeObserver;
  private headerResizeObserver?: ResizeObserver;

  private tableElement?: HTMLDivElement;
  private headerElement?: HTMLDivElement;
  private columnElements: HTMLVertexSceneTreeTableColumnElement[] = [];

  private cellHoverController = new SceneTreeCellHoverController();

  public componentWillLoad(): void {
    this.updateColumnElements();
    this.createPools();

    this.headerResizeObserver = new ResizeObserver(() => {
      this.stateMap.headerHeight = undefined;
      this.computeHeaderHeight();
      this.updateLayoutPosition();
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.updateLayoutPosition();
      this.clearLayoutHeight();
      this.clearLayoutWidth();
      this.recomputeColumnWidths();
      this.computeColumnGridLayout();
    });
  }

  public componentDidLoad(): void {
    this.computeColumnGridLayout();
    this.ensureDividerTemplateDefined();
    this.computeCellHeight();
    this.computeHeaderHeight();
    this.computeInitialColumnWidths();
    this.rebindHeaderData();

    this.tableElement?.addEventListener('scroll', this.handleScrollChanged, {
      passive: true,
    });

    if (this.headerElement != null) {
      this.headerResizeObserver?.observe(this.headerElement);
    }

    this.resizeObserver?.observe(this.hostEl);
  }

  public async componentWillRender(): Promise<void> {
    await this.computeAndUpdateViewportRows();
  }

  public componentDidRender(): void {
    this.layoutColumns();

    this.layoutRendered.emit();
  }

  public disconnectedCallback(): void {
    this.tableElement?.removeEventListener('scroll', this.handleScrollChanged);
    this.removeDividerDragListeners();
    this.headerResizeObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.stateMap.columnWidths = [];
    this.stateMap.columnWidthPercentages = [];
  }

  /**
   * Scrolls the table to the provided top value.
   *
   * @param top The position to scroll to.
   * @param options A set of options to configure the scrolling behavior.
   */
  @Method()
  public async scrollToPosition(
    top: number,
    options: Pick<DomScrollToOptions, 'behavior'>
  ): Promise<void> {
    if (this.tableElement != null) {
      scrollToTop(this.tableElement, top, options);
    }
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div
          class="header"
          ref={(ref) => (this.headerElement = ref)}
          style={{
            gridTemplateColumns: this.columnGridFixedLayout,
            display: this.columnElements.length <= 1 ? 'none' : 'grid',
          }}
        >
          <slot name="header" />
        </div>
        <div
          class="table"
          ref={(ref) => (this.tableElement = ref)}
          style={{
            gridTemplateColumns: this.columnGridLayout,
          }}
        >
          <slot
            onSlotchange={() => {
              this.ensureDividerTemplateDefined();
              this.updateColumnElements();
              this.recreateColumnPools();
              this.computeInitialColumnWidths();
              this.rebindHeaderData();
              this.computeColumnGridLayout();
            }}
          />
        </div>
        <div
          class="divider-overlay"
          style={{
            gridTemplateColumns: this.columnGridFixedLayout,
          }}
        >
          <slot name="divider" />
        </div>
        {this.resizingColumnIndex != null && <div class="resize-overlay" />}
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

  private async computeAndUpdateViewportRows(): Promise<void> {
    this.computeViewportRows();

    if (this.controller?.isConnected) {
      await this.controller.updateActiveRowRange(
        this.viewportStartIndex,
        this.viewportEndIndex
      );
    }
  }

  private layoutColumns = (): void => {
    const visibleRowCount = this.viewportEndIndex - this.viewportStartIndex + 1;
    const diff = this.viewportStartIndex - this.lastStartIndex;
    this.lastStartIndex = this.viewportStartIndex;

    this.iterateColumns((col, pool, colIndex) => {
      pool.updateElements(visibleRowCount);

      if (diff > 0) {
        pool.swapHeadToTail(diff);
      } else {
        pool.swapTailToHead(-diff);
      }

      col.style.minHeight = `${this.rowHeight * this.totalRows}px`;

      const cellPaddingLeft =
        colIndex === 0
          ? (depth: number) => `calc(${depth} * 0.5rem)`
          : () => `0`;

      pool.iterateElements((el, binding, rowIndex) => {
        const row = this.stateMap.viewportRows[rowIndex];

        if (isLoadedRow(row)) {
          this.updateCell(row, el, binding, rowIndex, cellPaddingLeft);
        }
      });
    });
  };

  private updateCell = (
    row: LoadedRow,
    cell: HTMLElement,
    binding: Binding,
    rowIndex: number,
    cellPaddingLeft: (depth: number) => string
  ): void => {
    cell.style.position = 'absolute';
    cell.style.top = `${
      (this.viewportStartIndex + rowIndex) * this.rowHeight
    }px`;
    cell.style.boxSizing = 'border-box';
    cell.style.height = `${this.rowHeight}px`;
    cell.style.width = '100%';
    cell.style.paddingLeft = cellPaddingLeft(row.node.depth);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    (cell as any).tree = this.tree;
    (cell as any).node = row.node;
    (cell as any).hoverController = this.cellHoverController;
    (cell as any).isScrolling = this.isScrolling;
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

  private recomputeColumnWidths = (): void => {
    const layoutWidth = this.getLayoutWidth();
    if (
      layoutWidth != null &&
      this.stateMap.columnWidths.length ===
        this.stateMap.columnWidthPercentages.length
    ) {
      this.stateMap.columnWidths = this.stateMap.columnWidthPercentages.map(
        (w) => w * layoutWidth
      );
    }
  };

  private recomputeColumnPercentages = (): void => {
    const layoutWidth = this.getLayoutWidth();
    if (
      layoutWidth != null &&
      this.stateMap.columnWidths.length ===
        this.stateMap.columnWidthPercentages.length
    ) {
      this.stateMap.columnWidthPercentages = this.stateMap.columnWidths.map(
        (w) => w / layoutWidth
      );
    }
  };

  private computeInitialColumnWidths = (): void => {
    this.stateMap.columnWidths = this.columnElements.map(
      (c) => c.initialWidth ?? 100
    );

    const layoutWidth = this.getLayoutWidth();
    if (layoutWidth != null) {
      this.stateMap.columnWidthPercentages = this.columnElements.map(
        (c) => (c.initialWidth ?? 100) / layoutWidth
      );
    }
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

  private recreateColumnPools(): void {
    this.columnElements.forEach((c) => {
      if (this.stateMap.columnElementPools?.get(c) == null) {
        this.stateMap.columnElementPools?.set(
          c,
          new ElementPool(c, () => this.createColumnCellInstance(c))
        );
      } else {
        this.stateMap.columnElementPools
          .get(c)
          ?.updateElementFactory(() => this.createColumnCellInstance(c));
      }
    });
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

  private ensureDividerTemplateDefined(): void {
    const template = this.hostEl.querySelector(
      'template[slot="divider"]'
    ) as HTMLTemplateElement;
    if (template == null) {
      const defaultDividerTemplate = document.createElement('template');
      defaultDividerTemplate.slot = 'divider';
      defaultDividerTemplate.innerHTML = `
        <vertex-scene-tree-table-resize-divider slot="divider">
        </vertex-scene-tree-table-resize-divider>
      `;
      this.hostEl.appendChild(defaultDividerTemplate);
    }
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

  private createDividerInstance(): InstancedTemplate<HTMLElement> {
    const template = this.hostEl.querySelector(
      'template[slot="divider"]'
    ) as HTMLTemplateElement;
    if (template != null) {
      return generateInstanceFromTemplate(template);
    } else {
      throw new Error('Table is missing divider template element');
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
          filterHit: false,
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

  private computeHeaderHeight = (): void => {
    if (this.stateMap.headerHeight == null) {
      this.stateMap.headerHeight =
        this.headerElement?.getBoundingClientRect().height;
      this.hostEl.style.setProperty(
        '--header-height',
        `${this.stateMap.headerHeight}px`
      );
    }
  };

  private computeColumnGridLayout = (): void => {
    if (this.stateMap.columnWidths.length === 0) {
      this.stateMap.columnWidths = this.columnElements.map(
        (c) => c.initialWidth ?? 100
      );
    }

    const layoutWidth = this.getLayoutWidth();
    if (layoutWidth != null) {
      if (this.stateMap.columnWidthPercentages.length === 0) {
        this.stateMap.columnWidthPercentages = this.columnElements.map(
          (c) => (c.initialWidth ?? 100) / layoutWidth
        );
      }
    }

    /**
     * This layout uses `1fr` instead of the final column width to
     * allow the final column to shrink when a scrollbar appears.
     *
     * This flex behavior is not desired for the header and divider
     * elements since they are not scrollable, and `columnGridFixedLayout`
     * should be used instead.
     */
    this.columnGridLayout = `${this.stateMap.columnWidths
      .slice(0, -1)
      .reduce((res, w) => `${res} ${w}px`, '')} 1fr`;

    this.columnGridFixedLayout = `${this.stateMap.columnWidths.reduce(
      (res, w) => `${res} ${w}px`,
      ''
    )}`;
  };

  private bindHeaderData = (): void => {
    if (this.stateMap.headerInstances == null) {
      this.stateMap.headerInstances = this.columnElements
        .map((c, i) => {
          const instance = this.createHeaderInstance(c);

          if (instance != null) {
            instance.element.style.paddingRight =
              i === this.columnElements.length - 1
                ? `0`
                : `var(--scene-tree-table-column-gap)`;
            instance.element.slot = 'header';
            instance.element.style.gridColumnStart = `${i + 1}`;
            instance.element.style.gridColumnEnd = `${i + 2}`;
            this.hostEl?.appendChild(instance.element);
          }

          return instance;
        })
        .filter((i) => i != null) as Array<InstancedTemplate<HTMLElement>>;
    }

    if (this.stateMap.headerDividerInstances == null) {
      this.stateMap.headerDividerInstances = this.columnElements
        .slice(0, -1)
        .map((_, i) => {
          const instance = this.createDividerInstance();

          instance.element.slot = 'divider';
          instance.element.style.position = 'absolute';
          instance.element.style.right = '0';
          instance.element.style.pointerEvents = 'auto';
          instance.element.style.gridColumnStart = `${i + 1}`;
          instance.element.style.gridColumnEnd = `${i + 2}`;
          this.hostEl?.appendChild(instance.element);

          return instance;
        });
    }
  };

  private rebindHeaderData = (): void => {
    this.removeDividerDragListeners();

    this.stateMap.headerInstances?.forEach((i) => i.element.remove());
    this.stateMap.headerDividerInstances?.forEach((i) => i.element.remove());
    this.stateMap.headerInstances = undefined;
    this.stateMap.headerDividerInstances = undefined;

    this.bindHeaderData();
    this.addDividerDragListeners();
  };

  private addDividerDragListeners(): void {
    this.stateMap.headerDividerListeners =
      this.stateMap.headerDividerInstances?.map((d, i) => {
        const listener = this.createDividerPointerDownHandler(i);

        d.element.addEventListener('pointerdown', listener);

        return listener;
      });
  }

  private removeDividerDragListeners(): void {
    if (this.stateMap.headerDividerListeners != null) {
      const listeners = this.stateMap.headerDividerListeners;

      this.stateMap.headerDividerInstances?.forEach((d, i) => {
        const listener = listeners[i];
        if (listener != null) {
          d.element.removeEventListener('pointerdown', listener);
        }
      });
      this.stateMap.headerDividerListeners = undefined;
    }
  }

  private createDividerPointerDownHandler = (
    index: number
  ): ((event: PointerEvent) => void) => {
    return (event: PointerEvent): void => {
      event.preventDefault();
      event.stopPropagation();

      this.lastDividerPointerPosition = Point.create(
        Math.floor(event.clientX),
        Math.floor(event.clientY)
      );
      this.resizingColumnIndex = index;
      this.stateMap.headerDividerInstances?.[index]?.element.classList.add(
        'dragging'
      );

      window.addEventListener('pointermove', this.handleDividerPointerMove);
      window.addEventListener('pointerup', this.handleDividerPointerUp);
    };
  };

  private handleDividerPointerMove = (event: PointerEvent): void => {
    const current = Point.create(
      Math.floor(event.clientX),
      Math.floor(event.clientY)
    );

    if (
      this.lastDividerPointerPosition != null &&
      this.resizingColumnIndex != null
    ) {
      const diff = Point.subtract(this.lastDividerPointerPosition, current);

      if (
        Math.abs(diff.x) >= 1 &&
        this.isValidResize(diff, this.resizingColumnIndex)
      ) {
        this.stateMap.columnWidths[this.resizingColumnIndex] -= diff.x;

        if (this.resizingColumnIndex + 1 < this.stateMap.columnWidths.length) {
          this.stateMap.columnWidths[this.resizingColumnIndex + 1] += diff.x;
        }

        this.lastDividerPointerPosition = current;
        this.computeColumnGridLayout();
      }
    }
  };

  private handleDividerPointerUp = (): void => {
    if (this.resizingColumnIndex != null) {
      this.stateMap.headerDividerInstances?.[
        this.resizingColumnIndex
      ]?.element.classList.remove('dragging');
    }
    this.lastDividerPointerPosition = undefined;
    this.resizingColumnIndex = undefined;

    this.recomputeColumnPercentages();

    window.removeEventListener('pointermove', this.handleDividerPointerMove);
    window.removeEventListener('pointerup', this.handleDividerPointerUp);
  };

  private isValidResize = (diff: Point.Point, index: number): boolean => {
    const currentColumn = this.columnElements[index];
    const nextColumn = this.columnElements[index + 1];
    const currentWidth = this.stateMap.columnWidths[index];
    const nextWidth = this.stateMap.columnWidths[index + 1];
    const currentMinWidth = currentColumn.minWidth ?? 0;
    const currentMaxWidth = currentColumn.maxWidth ?? Number.MAX_SAFE_INTEGER;
    const nextMinWidth = nextColumn.minWidth ?? 0;
    const nextMaxWidth = nextColumn.maxWidth ?? Number.MAX_SAFE_INTEGER;

    const currentIsValid =
      currentWidth - diff.x > currentMinWidth &&
      currentWidth - diff.x < currentMaxWidth;
    const nextIsValid =
      nextColumn != null
        ? nextWidth + diff.x > nextMinWidth && nextWidth + diff.x < nextMaxWidth
        : true;

    return currentIsValid && nextIsValid;
  };

  private handleScrollChanged = (event: Event): void => {
    this.isScrolling = true;

    this.scrollTimer = restartTimeout(() => {
      this.isScrolling = false;
    }, this.scrollTimer);

    this.scrollOffset = (event.target as HTMLElement).scrollTop;
    this.computeAndUpdateViewportRows();
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

  private getLayoutWidth(): number | undefined {
    if (this.layoutWidth == null) {
      const computedWidth = getSceneTreeTableViewportWidth(this.hostEl);
      if (computedWidth > 0) {
        this.layoutWidth = computedWidth;
      }
    }
    return this.layoutWidth;
  }

  private clearLayoutHeight(): void {
    this.layoutHeight = undefined;
  }

  private clearLayoutWidth(): void {
    this.layoutWidth = undefined;
  }
}
