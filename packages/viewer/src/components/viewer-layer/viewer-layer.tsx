import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-layer',
  styleUrl: 'viewer-layer.css',
  shadow: true,
})
export class ViewerLayer {
  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
