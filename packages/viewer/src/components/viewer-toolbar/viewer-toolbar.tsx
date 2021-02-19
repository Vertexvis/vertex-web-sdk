import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-toolbar',
  styleUrl: 'viewer-toolbar.css',
  shadow: true,
})
export class ViewerToolbar {
  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="viewer-toolbar">
          <slot></slot>
        </div>
      </Host>
    );
  }
}
