import { Component, h, Prop } from '@stencil/core';
import classname from 'classnames';

import { ViewerToolbarDirection, ViewerToolbarPlacement } from './types';

@Component({
  tag: 'vertex-viewer-toolbar',
  styleUrl: 'viewer-toolbar.css',
  shadow: true,
})
export class ViewerToolbar {
  /**
   * Specifies where the toolbar is positioned.
   */
  @Prop()
  public placement: ViewerToolbarPlacement = 'bottom-center';

  @Prop()
  public direction: ViewerToolbarDirection = 'horizontal';

  public render(): h.JSX.IntrinsicElements {
    const [vertical, horizontal] = this.placement.split('-');

    return (
      <vertex-viewer-layer
        class={classname('layer', {
          'position-top': vertical === 'top',
          'position-middle': vertical === 'middle',
          'position-bottom': vertical === 'bottom',
          'position-left': horizontal === 'left',
          'position-center': horizontal === 'center',
          'position-right': horizontal === 'right',
        })}
      >
        <div
          class={classname('inner', {
            vertical: this.direction === 'vertical',
            horizontal: this.direction === 'horizontal',
          })}
        >
          <slot></slot>
        </div>
      </vertex-viewer-layer>
    );
  }
}
