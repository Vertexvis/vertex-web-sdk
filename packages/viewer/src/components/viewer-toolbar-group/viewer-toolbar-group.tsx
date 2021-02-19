import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-toolbar-group',
  styleUrl: 'viewer-toolbar-group.css',
  shadow: true,
})
export class ViewerToolbarGroup {
  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
