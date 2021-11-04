import {
  Component,
  Host,
  h,
  Prop,
  EventEmitter,
  Event,
  State,
  Method,
  Element,
  Watch,
  readTask,
} from '@stencil/core';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import classNames from 'classnames';
import { ElementPool } from '../scene-tree/lib/element-pool';
import { LoadedRow, Row } from '../scene-tree/lib/row';
import {
  generateInstanceFromTemplate,
  InstancedTemplate,
} from '../scene-tree/lib/templates';

interface StateMap {
  columnElementPools?: WeakMap<
    HTMLVertexSceneTreeTableColumnElement,
    ElementPool
  >;
  headerTemplate?: HTMLTemplateElement;
  headerInstance?: InstancedTemplate<HTMLElement>;
  headerElementPool?: ElementPool;
}

@Component({
  tag: 'vertex-scene-tree-table',
  styleUrl: 'scene-tree-table.css',
  shadow: true,
})
export class SceneTreeTable {
  /**
   * A reference to the scene tree to perform operations for interactions. Such
   * as expansion, visibility and selection.
   */
  @Prop()
  public tree?: HTMLVertexSceneTreeElement;

  @Prop()
  public rows: Row[] = [];

  @Prop()
  public visibleRows: Row[] = [];

  @Prop()
  public visibleStartIndex = 0;

  @Prop()
  public visibleEndIndex = 0;

  @Prop()
  public totalRows = 0;

  @Prop({ mutable: true })
  public rowHeight = 24;

  @Prop({ mutable: true })
  public scrollOffset = 0;

  @Prop({ mutable: true })
  public layoutOffset = 0;

  @Event()
  public scrollOffsetChanged!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  @State()
  private columnWidths: Array<number | undefined> = [];

  @State()
  private columnLabels: Array<string | undefined> = [];

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
  private stateMap: StateMap = {};

  private lastStartIndex = 0;
  private resizeObserver?: ResizeObserver;

  private tableElement?: HTMLDivElement;
  private columnElements: HTMLVertexSceneTreeTableColumnElement[] = [];

  public componentWillLoad(): void {
    this.updateColumnElements();
    this.computeColumnWidths();
    this.validateHeaderTemplate();
    this.createPools();
    this.bindHeaderData();

    this.columnElements.forEach((c) => {
      c.addEventListener('hovered', this.handleCellHover as EventListener);
    });

    this.resizeObserver = new ResizeObserver(this.updateLayoutPosition);
    this.resizeObserver.observe(this.hostEl);
  }

  public componentDidLoad(): void {
    this.computeCellHeight();
  }

  public componentDidRender(): void {
    this.layoutColumns();
  }

  public disconnectedCallback(): void {
    this.columnElements.forEach((c) => {
      c.removeEventListener('hovered', this.handleCellHover as EventListener);
    });
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot name="header" />
        <div
          class="table"
          ref={(ref) => (this.tableElement = ref)}
          style={{
            gridTemplateColumns: `${this.columnWidths
              .slice(0, -1)
              .reduce((res, w) => `${res} ${w}px`, '')} 1fr`,
          }}
          onScroll={this.handleScrollChanged}
        >
          <slot onSlotchange={this.bindHeaderData} />
        </div>
      </Host>
    );
  }

  private layoutColumns = (): void => {
    const visibleRowCount = this.visibleEndIndex - this.visibleStartIndex + 1;
    const diff = this.visibleStartIndex - this.lastStartIndex;
    this.lastStartIndex = this.visibleStartIndex;

    this.iterateColumns((col, pool, colIndex) => {
      pool.updateElements(visibleRowCount);

      if (diff > 0) {
        pool.swapHeadToTail(diff);
      } else {
        pool.swapTailToHead(-diff);
      }

      col.style.minHeight = `${this.rowHeight * this.totalRows}px`;

      pool.iterateElements((el, binding, rowIndex) => {
        const cell = el as HTMLVertexSceneTreeTableCellElement;
        const row = this.visibleRows[rowIndex];
        if (row != null) {
          cell.style.position = 'absolute';
          cell.style.top = `${
            (this.visibleStartIndex + rowIndex) * this.rowHeight
          }px`;

          cell.style.height = `${this.rowHeight}px`;
          if (colIndex === 0) {
            cell.style.paddingLeft = `calc(${row.node.depth} * 0.5rem)`;
            cell.expandToggle = true;
          }
          cell.visibilityToggle = colIndex === this.columnElements.length - 1;
          cell.style.width =
            col.initialWidth != null
              ? `min(${col.initialWidth}px, 100%)`
              : '100%';
          cell.tree = this.tree;
          cell.node = row.node;

          this.toggleAttribute(
            cell,
            'is-hovered',
            this.hoveredNodeId === row.node.id?.hex
          );
          this.toggleAttribute(cell, 'is-hidden', !row.node.visible);
          this.toggleAttribute(cell, 'is-selected', row.node.selected);
          this.toggleAttribute(cell, 'is-partial', row.node.partiallyVisible);
          this.toggleAttribute(cell, 'is-leaf', row.node.isLeaf);

          binding.bind(row);
        }
      });
    });
  };

  private updateLayoutPosition = (): void => {
    readTask(() => {
      this.layoutOffset = this.tableElement?.getBoundingClientRect().top ?? 0;
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

  private validateHeaderTemplate(): void {
    const template = this.hostEl.querySelector(
      'template[slot="header"]'
    ) as HTMLTemplateElement;
    this.stateMap.headerTemplate = template ?? undefined;
  }

  private createHeaderInstance(): InstancedTemplate<HTMLElement> | undefined {
    if (this.stateMap.headerTemplate != null) {
      return generateInstanceFromTemplate(this.stateMap.headerTemplate);
    }
  }

  private createColumnCellInstance(
    column: HTMLVertexSceneTreeTableColumnElement
  ): InstancedTemplate<HTMLElement> {
    const template = column.querySelector('template');
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
      this.rowHeight = height;
      element.remove();
      this.isComputingCellHeight = false;
    }
  };

  private computeColumnWidths = (): void => {
    this.columnWidths = this.columnElements.map((c) => c.initialWidth);
    this.columnLabels = this.columnElements.map((c) => c.label);
  };

  private handleCellHover = (
    event: CustomEvent<Node.AsObject | undefined>
  ): void => {
    this.hoveredNodeId = event.detail?.id?.hex;
  };

  private bindHeaderData = (): void => {
    if (this.stateMap.headerInstance == null) {
      const instance = this.createHeaderInstance();
      this.stateMap.headerInstance = instance;

      if (instance != null) {
        this.hostEl.appendChild(instance.element);
      }
    }

    this.stateMap.headerInstance?.bindings.bind({
      columnWidths: this.columnWidths,
      columnLabels: this.columnLabels,
    });
  };

  private handleScrollChanged = (event: Event): void => {
    this.scrollOffset = (event.target as HTMLElement).scrollTop;
    this.scrollOffsetChanged.emit();
  };

  private toggleAttribute(el: HTMLElement, attr: string, value: boolean): void {
    if (value) {
      el.setAttribute(attr, '');
    } else {
      el.removeAttribute(attr);
    }
  }
}
