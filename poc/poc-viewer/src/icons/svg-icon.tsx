import { h, Component, Host } from '@stencil/core';

@Component({
  tag: 'svg-icon',
  styleUrl: 'svg-icon.css',
})
export class SvgIcon {
  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="svg-icon-container">
          <slot />
        </div>
      </Host>
    );
  }
}
