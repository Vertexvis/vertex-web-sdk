import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-toolbar',
  styleUrl: 'viewer-toolbar.css',
  scoped: true,
})
export class Toolbar {
  /**
   * The `vertex-viewer` component that this toolbar will interact with.
   * This property can be injected by the `vertex-viewer` when a `data-viewer="{{viewer element id}}"` attribute is present.
   */
  @Prop() public viewer?: HTMLVertexViewerElement;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="viewer-toolbar-root">
          <viewer-toolbar-group>
            <viewer-toolbar-camera-tools viewer={this.viewer} />
            <viewer-toolbar-fit-all-tool viewer={this.viewer} />
          </viewer-toolbar-group>
        </div>
      </Host>
    );
  }
}
