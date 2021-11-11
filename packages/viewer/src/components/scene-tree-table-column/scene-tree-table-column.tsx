import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'vertex-scene-tree-table-column',
  styleUrl: 'scene-tree-table-column.css',
  shadow: true,
})
export class SceneTreeTableColumn {
  /**
   * The initial width of this column.
   */
  @Prop()
  public initialWidth?: number;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="hidden">
          <slot name="header" />
        </div>
        <div class="column">
          <slot />
        </div>
      </Host>
    );
  }
}
