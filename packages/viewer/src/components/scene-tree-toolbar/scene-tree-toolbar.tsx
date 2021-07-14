import { Component, Host, h } from '@stencil/core';

/**
 * @slot The primary content that will be placed in the center of the toolbar
 * and stretch to container's available width.
 * @slot before - Content that is placed before the primary content.
 * @slot after - Content that is placed after the primary content.
 */
@Component({
  tag: 'vertex-scene-tree-toolbar',
  styleUrl: 'scene-tree-toolbar.css',
  shadow: true,
})
export class SceneTreeToolbar {
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="content">
          <slot name="before" />
        </div>
        <div class="content content-primary">
          <slot />
        </div>
        <div class="content">
          <slot name="after" />
        </div>
      </Host>
    );
  }
}
