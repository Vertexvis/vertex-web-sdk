import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'vertex-scene-tree-toolbar',
  styleUrl: 'scene-tree-toolbar.css',
  shadow: true,
})
export class SceneTreeToolbar {
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
