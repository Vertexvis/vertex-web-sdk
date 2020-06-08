import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'viewer-toolbar-group',
  styleUrl: 'viewer-toolbar-group.css',
  scoped: true,
})
export class Group {
  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="viewer-toolbar-group-root">
          <slot />
        </div>
      </Host>
    );
  }
}
