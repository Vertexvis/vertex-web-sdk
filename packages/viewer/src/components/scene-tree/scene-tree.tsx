import {
  Component,
  Element,
  h,
  Host,
  Method,
  Prop,
  readTask,
  writeTask,
} from '@stencil/core';
import { InstancedTemplate, append } from './lib/templates';
import { Row } from '../../scene-tree';

// eslint-disable-next-line @typescript-eslint/ban-types
export type RowDataProvider = (row: Row) => object;

interface ComponentMetrics {
  scrollTop: number;
  viewportHeight: number;
}

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

  @Element()
  private el!: HTMLElement;

  private container: HTMLElement | undefined;
  private template: HTMLTemplateElement | undefined;
  private instances: InstancedTemplate<HTMLElement>[] = [];
  private previousStart = 0;

  private items = Array.from({ length: 10000 }).map((_, i) => ({
    id: i.toString(),
    name: `Item ${i + 1}`,
    selected: false,
    loading: false,
    expanded: false,
    data: {},
  }));

  private computedItemHeight: number | undefined;
  private resizeObserver: ResizeObserver;

  public constructor() {
    this.resizeObserver = new ResizeObserver(() => this.invalidateRows());
  }

  @Prop()
  public rowData: RowDataProvider = () => ({});

  public async componentDidLoad(): Promise<void> {
    this.el.addEventListener('scroll', () => this.handleScroll());
    this.resizeObserver.observe(this.el);

    const template = this.el.querySelector('template');
    if (template != null) {
      this.template = template;
      this.computedItemHeight = await this.computeItemHeight(template);

      this.scheduleDomUpdate();
    }
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="item-container" ref={(el) => (this.container = el)} />
      </Host>
    );
  }

  @Method()
  public async invalidateRows(): Promise<void> {
    this.scheduleDomUpdate();
    // this.scheduleDomUpdateRaf();
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

  private async scheduleDomUpdate(): Promise<void> {
    const metrics = await this.readDom();
    const rows = this.updateDom(metrics);
    rows.forEach(([row, instance]) => {
      instance.bindings.bind(row);
    });
  }

  private scheduleDomUpdateRaf(): void {
    requestAnimationFrame(() => {
      const metrics = this.readDomSync();
      const rows = this.updateDom(metrics);
      rows.forEach(([row, instance]) => {
        instance.bindings.bind(row);
      });
    });
  }

  private readDom(): Promise<ComponentMetrics> {
    return new Promise((resolve) => {
      readTask(() => {
        resolve({
          scrollTop: this.el.scrollTop,
          viewportHeight: this.el.clientHeight,
        });
      });
    });
  }

  private readDomSync(): ComponentMetrics {
    return {
      scrollTop: this.el.scrollTop,
      viewportHeight: this.el.clientHeight,
    };
  }

  private updateDom({
    scrollTop,
    viewportHeight,
  }: ComponentMetrics): [Row, InstancedTemplate<HTMLElement>][] {
    if (
      this.template != null &&
      this.container != null &&
      this.computedItemHeight != null
    ) {
      const itemHeight = this.computedItemHeight;
      const totalHeight = itemHeight * this.items.length;

      const halfOffscreenItemCount = this.offscreenItemCount / 2;
      const itemCount = Math.ceil(
        viewportHeight / itemHeight + this.offscreenItemCount
      );
      const start = Math.max(
        0,
        Math.floor(scrollTop / itemHeight - halfOffscreenItemCount)
      );
      const end = Math.min(
        this.items.length,
        start + itemCount + halfOffscreenItemCount
      );

      const items = this.items
        .slice(start, end)
        .map((row) => this.populateRowData(row));
      const offsetY = start * itemHeight;

      this.container.style.height = `${totalHeight}px`;

      const children = this.container.children;
      const newChildren = items.length - children.length;

      for (let i = 0; i < newChildren; i++) {
        const item = items[i];
        const node = this.createNode(this.template, item) as HTMLElement;
        const instance = append(this.container, node, item);
        this.instances.push(instance);
      }

      this.reorder(start);

      const result: [Row, InstancedTemplate<HTMLElement>][] = [];
      this.instances.forEach((instance, i) => {
        instance.element.style.position = 'absolute';
        instance.element.style.top = `${offsetY + (itemHeight || 0) * i}px`;
        result.push([items[i], instance]);
      });
      return result;
    } else {
      return [];
    }
  }

  private reorder(newStart: number): void {
    const diff = newStart - this.previousStart;
    const allInvalid = Math.abs(diff) > this.instances.length;
    this.previousStart = newStart;

    // There's no point to reorder, everything is invalid.
    if (allInvalid) {
      return;
    }

    // Scrolling down. Shift the items at the top, and move them to the bottom.
    if (diff > 0) {
      const toMove = this.instances.splice(0, diff);
      this.instances.splice(this.instances.length, 0, ...toMove);

      for (let i = 0; i < diff; i++) {
        const child = this.container?.firstChild;
        if (child != null) {
          this.container?.append(child);
        }
      }
    }
    // Scrolling up. Pop the items off the end, and move them to the beginning.
    else if (diff < 0) {
      const toMove = this.instances.splice(diff, -diff);
      this.instances.splice(0, 0, ...toMove);

      for (let i = 0; i < -diff; i++) {
        const child = this.container?.lastChild;
        if (child != null) {
          this.container?.prepend(child);
        }
      }
    }
  }

  private handleScroll(): void {
    this.invalidateRows();
  }

  private async computeItemHeight(
    template: HTMLTemplateElement
  ): Promise<number | undefined> {
    const item = {
      id: '',
      name: 'foo',
      loading: false,
      selected: false,
      expanded: false,
      data: {},
    };
    const node = this.createNode(template, item);
    this.el.shadowRoot?.appendChild(node);
    const element = this.el.shadowRoot?.lastElementChild;

    if (element != null) {
      const el = element as HTMLElement;
      if (typeof (el as any).componentOnReady === 'function') {
        await (el as any).componentOnReady();
      }

      const height = el.offsetHeight;
      el.remove();
      return height;
    } else {
      throw new Error(
        'Cannot compute row height. Placeholder row cannot be created.'
      );
    }
  }

  private createNode(template: HTMLTemplateElement, item: Row): Node {
    const content = template.content;
    const node = content.cloneNode(true) as HTMLElement;
    return node;
  }

  private populateRowData(row: Row): Row {
    if (row.loading) {
      return row;
    } else {
      const data = this.rowData(row);
      return { ...row, data };
    }
  }
}
