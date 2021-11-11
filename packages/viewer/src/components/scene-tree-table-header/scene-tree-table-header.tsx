import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'vertex-scene-tree-table-header',
  styleUrl: 'scene-tree-table-header.css',
  shadow: true,
})
export class SceneTreeTableHeader {
  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="header">
          <slot />
        </div>
      </Host>
    );
  }
}
