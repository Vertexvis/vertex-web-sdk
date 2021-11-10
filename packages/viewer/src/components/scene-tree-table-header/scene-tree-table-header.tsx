import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'vertex-scene-tree-table-header',
  styleUrl: 'scene-tree-table-header.css',
  shadow: true,
})
export class SceneTreeTableHeader {
  /**
   * The label to display in this header.
   */
  @Prop()
  public label?: string;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="header">{this.label}</div>
      </Host>
    );
  }
}
