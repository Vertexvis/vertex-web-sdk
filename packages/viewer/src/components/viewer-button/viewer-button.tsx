import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-button',
  styleUrl: 'viewer-button.css',
  shadow: true,
})
export class ViewerButton {
  /**
   * Accessible name applied to the internal native button. Use this for
   * icon-only buttons or when the slotted content does not provide a name.
   */
  @Prop({ attribute: 'aria-label' })
  public ariaLabel: string | null = null;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <button class="viewer-button" aria-label={this.ariaLabel}>
          <slot></slot>
        </button>
      </Host>
    );
  }
}
