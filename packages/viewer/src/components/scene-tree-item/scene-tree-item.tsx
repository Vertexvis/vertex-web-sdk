import { Component, Element, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'vertex-scene-tree-item',
  styleUrl: 'scene-tree-item.css',
  shadow: true,
})
export class SceneTreeItem {
  @Prop()
  public name: string | undefined;

  @Element()
  private el!: HTMLElement;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="label">{this.name}</div>
        <div class="right">
          <slot></slot>
        </div>
      </Host>
    );
  }
}
