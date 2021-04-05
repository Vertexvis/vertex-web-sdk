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

// eslint-disable-next-line @typescript-eslint/ban-types
export type RowDataProvider = (row: Row) => object;

@Component({
  tag: 'vertex-scene-tree',
  styleUrl: 'scene-tree.css',
  shadow: true,
})
export class SceneTree {
  @Prop()
  public approximateItemHeight = 20;

  @Prop()
  public offscreenItemCount = 2;

  @Prop()
  public overScanCount = 10;

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

  private items = Array.from({ length: 10000 }).map((_, i) => ({
    id: i.toString(),
    name: `Item ${i + 1}`,
    selected: false,
    loading: false,
    expanded: false,
    data: {},
  }));

  private computedItemHeight: number | undefined;

  private scrollTop = 0;

  private leftTemplate: HTMLTemplateElement | undefined;
  private rightTemplate: HTMLTemplateElement | undefined;
  private bindings = new Map<Element, CollectionBinding>();

  @Prop()
  public rowData: RowDataProvider = () => ({});

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
      this.updateState();
    });
  }

  public componentDidRender(): void {
    this.cleanupBindings();
    this.computeRowHeight();
  }

  public render(): h.JSX.IntrinsicElements {
    const itemHeight = this.getComputedOrPlaceholderRowHeight();
    const totalHeight = this.items.length * itemHeight;
    const startY = this.startIndex * itemHeight;
    return (
      <Host>
        <div class="rows" style={{ height: `${totalHeight}px` }}>
          {this.isComputingItemHeight ? (
            <div class="row" />
          ) : (
            this.viewportItems.map((row, i) => {
              return (
                !row.loading && (
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
                    <span class="row-text">{row.name}</span>
                    <span
                      ref={(el) => {
                        if (el != null && this.rightTemplate != null) {
                          this.populateSlot(this.rightTemplate, row, el);
                        }
                      }}
                    />
                  </div>
                )
              );
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
      this.updateState();
    });
  }

  @Method()
  public async scrollToIndex(index: number): Promise<void> {
    // TODO(dan): Add alignment to top, center, or bottom.
    const i = Math.max(0, Math.min(index, this.items.length));

    if (this.computedItemHeight != null) {
      const top = i * this.computedItemHeight;
      this.el.scrollTo({ top, behavior: 'smooth' });
    }
  }

  private updateState(): void {
    if (this.viewportHeight != null) {
      const itemHeight = this.getComputedOrPlaceholderRowHeight();
      const itemCount = Math.ceil(this.viewportHeight / itemHeight);
      const start = Math.max(
        0,
        Math.floor(this.scrollTop / itemHeight) - this.overScanCount
      );
      const end = Math.min(
        this.items.length,
        start + itemCount + this.overScanCount * 2
      );

      this.startIndex = start;
      this.viewportItems = this.items
        .slice(start, end)
        .map((row) => this.populateRowData(row));
    }
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
    if (this.rowData != null && !row.loading) {
      const data = this.rowData(row);
      return { ...row, data };
    } else {
      return row;
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
}
