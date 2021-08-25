/* eslint-disable @typescript-eslint/member-ordering */

import {
  Component,
  Host,
  h,
  Element,
  Prop,
  State,
  Event,
  EventEmitter,
} from '@stencil/core';
import { ElementPool } from '../scene-tree/lib/element-pool';
import { Row } from '../scene-tree/lib/row';
import { generateInstanceFromTemplate } from '../scene-tree/lib/templates';

@Component({
  tag: 'vertex-scene-tree-table-layout',
  styleUrl: 'scene-tree-table-layout.css',
  shadow: true,
})
export class SceneTreeTableLayout {
  @Element()
  private hostEl!: HTMLElement;

  @State()
  private numVisibleRows = 50;

  @State()
  private invalidateRenderCounter = 0;

  private lastStartIndex = 0;

  private columns: HTMLVertexSceneTreeTableColumnElement[] = [];

  private pools = new WeakMap<
    HTMLVertexSceneTreeTableColumnElement,
    ElementPool
  >();

  private separatorsEl?: HTMLElement;

  private verticalSeparatorPool?: ElementPool;

  @Prop()
  public visibleStartIndex = 0;

  @Prop()
  public visibleEndIndex = 0;

  @Prop()
  public visibleRows: Row[] = [];

  @Prop()
  public rows: Row[] = [];

  @Prop({ mutable: true })
  public scrollOffset = 0;

  @Prop()
  public rowHeight = 20;

  @Event()
  public scrollOffsetChanged!: EventEmitter<void>;

  protected componentWillLoad(): void {
    this.columns = Array.from(
      this.hostEl.querySelectorAll(
        'vertex-scene-tree-table-column[slot="column"]'
      )
    );
    this.columns.forEach((column) => {
      if (!this.pools.has(column)) {
        column.addEventListener('widthChanged', () => this.invalidate());

        this.pools.set(
          column,
          new ElementPool(this.hostEl, () => {
            const template = column.querySelector('template');
            if (template != null) {
              return generateInstanceFromTemplate(template);
            } else {
              throw new Error('Column is missing template element');
            }
          })
        );
      }
    });
    console.log('columns', this.columns);
  }

  protected componentDidLoad(): void {
    if (this.separatorsEl != null) {
      const separatorTemplate = document.createElement('template');
      separatorTemplate.innerHTML =
        '<div class="vertical-separator" event:mouseDown="{{row.separatorMouseDown}}"></div>';
      this.verticalSeparatorPool = new ElementPool(this.separatorsEl, () =>
        generateInstanceFromTemplate(separatorTemplate)
      );
    }
  }

  protected componentDidRender(): void {
    this.layoutChildren();
  }

  private invalidate(): void {
    this.invalidateRenderCounter = this.invalidateRenderCounter + 1;
  }

  private layoutChildren(): void {
    const rowsEl = this.hostEl.shadowRoot?.querySelector(
      '.rows'
    ) as HTMLElement;
    const totalHeight = this.rows.length * this.rowHeight;
    rowsEl.style.height = `${totalHeight}px`;

    const numRows = this.visibleEndIndex - this.visibleStartIndex + 1;
    const diff = this.visibleStartIndex - this.lastStartIndex;
    this.lastStartIndex = this.visibleStartIndex;

    let startX = 0;

    this.iterateColumns((col, pool) => {
      pool.updateElements(numRows);

      if (diff > 0) {
        pool.swapHeadToTail(diff);
      } else {
        pool.swapTailToHead(-diff);
      }

      pool.iterateElements((el, binding, rowIndex) => {
        const row = this.visibleRows[rowIndex];
        if (row != null) {
          el.style.position = 'absolute';
          el.style.top = `${
            (this.visibleStartIndex + rowIndex) * this.rowHeight
          }px`;
          el.style.left = `${startX}px`;
          el.style.width = `${col.width}px`;
          el.style.height = `${this.rowHeight}px`;
          binding.bind(row);
        }
      });

      startX = startX + col.width;
    });

    startX = 0;
    this.verticalSeparatorPool?.updateElements(this.columns.length - 1);
    this.verticalSeparatorPool?.iterateElements((el, bind, index) => {
      const col = this.columns[index];
      startX = startX + col.width;
      el.style.position = 'absolute';
      el.style.boxSizing = 'border-box';
      el.style.left = `${startX}px`;
      el.style.height = `${totalHeight}px`;
      el.style.width = '2px';
      bind.bind({
        column: col,
        separatorMouseDown: (event: MouseEvent) =>
          this.handleSeparatorMouseDown(col, event),
      });
    });
  }

  private handleSeparatorMouseDown(
    col: HTMLVertexSceneTreeTableColumnElement,
    event: MouseEvent
  ): void {
    const startX = event.clientX;
    const startWidth = col.width;

    function mouseMove(event: MouseEvent): void {
      const diffX = event.clientX - startX;
      col.width = Math.max(startWidth + diffX, col.minWidth);
    }

    function mouseUp(): void {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', mouseUp);
    }

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);
  }

  private iterateColumns(
    f: (
      column: HTMLVertexSceneTreeTableColumnElement,
      pool: ElementPool,
      index: number
    ) => void
  ): void {
    this.columns.forEach((column, i) => {
      const pool = this.pools.get(column);
      if (pool != null) {
        f(column, pool, i);
      } else {
        throw new Error('Cannot find pool for column');
      }
    });
  }

  private handleColumnSlotChange = (event: Event): void => {
    console.log('slot changed', event);
  };

  private handleScrollChanged = (event: Event): void => {
    this.scrollOffset = (event.target as HTMLElement).scrollTop;
    this.scrollOffsetChanged.emit();
  };

  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="container" onScroll={this.handleScrollChanged}>
          <div class="rows">
            <slot></slot>
          </div>
          <div ref={(ref) => (this.separatorsEl = ref)} class="separators" />
        </div>

        <slot name="column" onSlotchange={this.handleColumnSlotChange}></slot>
      </Host>
    );
  }
}
