import { Component, h, Prop } from '@stencil/core';
import classNames from 'classnames';

export type ViewerToolbarGroupDirection = 'horizontal' | 'vertical';

@Component({
  tag: 'vertex-viewer-toolbar-group',
  styleUrl: 'viewer-toolbar-group.css',
  shadow: true,
})
export class ViewerToolbarGroup {
  @Prop()
  public direction: ViewerToolbarGroupDirection = 'horizontal';

  public render(): h.JSX.IntrinsicElements {
    return (
      <div
        class={classNames('inner', {
          horizontal: this.direction === 'horizontal',
          vertical: this.direction === 'vertical',
        })}
      >
        <slot></slot>
      </div>
    );
  }
}
