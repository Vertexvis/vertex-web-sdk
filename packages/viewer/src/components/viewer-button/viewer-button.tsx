import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-button',
  styleUrl: 'viewer-button.css',
  shadow: true,
})
export class ViewerButton {
  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <button class="viewer-button">
          <slot></slot>
        </button>
      </Host>
    );
  }
}
