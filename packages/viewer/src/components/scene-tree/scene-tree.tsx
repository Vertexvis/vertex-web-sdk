import { Component, Element, h, Host, Method, Prop } from '@stencil/core';
import { InstancedTemplate, append } from './lib/templates';
import { Row } from '../../scene-tree';

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
  public offscreenItemCount = 20;

  @Element()
  private el!: HTMLElement;

  private container: HTMLElement | undefined;
  private template: HTMLTemplateElement | undefined;
  private instances: InstancedTemplate<HTMLElement>[] = [];

  private items = Array.from({ length: 10000 }).map((_, i) => ({
    name: `Item ${i + 1}`,
    selected: false,
    loading: false,
    expanded: false,
    data: {},
  }));

  private computedItemHeight: number | undefined;

  @Prop()
  public rowData: RowDataProvider = () => ({});

  public async componentDidLoad(): Promise<void> {
    this.el.addEventListener('scroll', () => this.handleScroll());

    const template = this.el.querySelector('template');
    if (template != null) {
      this.template = template;
      this.computedItemHeight = await this.determineItemHeight(template);

      this.renderDom();
    }
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="item-container" ref={(el) => (this.container = el)}></div>
      </Host>
    );
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

  private renderDom(): void {
    if (
      this.template != null &&
      this.container != null &&
      this.computedItemHeight != null
    ) {
      const itemHeight = this.computedItemHeight;
      const scrollTop = this.el.scrollTop;
      const height = this.el.clientHeight;
      const totalHeight = itemHeight * this.items.length;

      const halfOffscreenItemCount = this.offscreenItemCount / 2;
      const itemCount = Math.ceil(
        height / itemHeight + this.offscreenItemCount
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
        .slice(start, end + 1)
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

      this.instances.forEach(({ element, bindings }, i) => {
        element.style.position = 'absolute';
        element.style.top = `${offsetY + (itemHeight || 0) * i}px`;

        bindings.bind(items[i]);
      });
    }
  }

  private handleScroll(): void {
    requestAnimationFrame(() => this.renderDom());
  }

  private async determineItemHeight(
    template: HTMLTemplateElement
  ): Promise<number | undefined> {
    const item = {
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
