/* eslint-disable @typescript-eslint/member-ordering */

import {
  Component,
  Host,
  h,
  Prop,
  Watch,
  Event,
  EventEmitter,
} from '@stencil/core';

@Component({
  tag: 'vertex-scene-tree-table-column',
  styleUrl: 'scene-tree-table-column.css',
  shadow: true,
})
export class SceneTreeTableColumn {
  @Event()
  public widthChanged!: EventEmitter<void>;

  @Prop()
  public width = 80;

  @Watch('width')
  protected handleWidthChanged(newValue: number, oldValue: number): void {
    if (newValue !== oldValue) {
      this.widthChanged.emit();
    }
  }

  @Prop()
  public minWidth = 10;

  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
