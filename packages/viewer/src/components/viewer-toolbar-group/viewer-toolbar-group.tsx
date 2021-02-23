import { Component, h } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-toolbar-group',
  styleUrl: 'viewer-toolbar-group.css',
  shadow: true,
})
export class ViewerToolbarGroup {
  public render(): h.JSX.IntrinsicElements {
    return (
      <div class="inner">
        <slot></slot>
      </div>
    );
  }
}
