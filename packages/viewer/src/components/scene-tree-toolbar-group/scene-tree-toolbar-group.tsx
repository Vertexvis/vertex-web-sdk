import { Component, h, Host } from '@stencil/core';

/**
 * @slot The content of the group.
 */
@Component({
  tag: 'vertex-scene-tree-toolbar-group',
  styleUrl: 'scene-tree-toolbar-group.css',
  shadow: true,
})
export class SceneTreeToolbarGroup {
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
