import { Component, Host, h, Prop, Element } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-layer',
  styleUrl: 'viewer-layer.css',
  shadow: true,
})
export class ViewerLayer {
  /**
   * Indicates if the layer should stretch to fill the size of its container's
   * nearest positioned parent.
   */
  @Prop({ reflect: true }) public stretchOff = false;

  @Element() private hostEl!: HTMLElement;

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
