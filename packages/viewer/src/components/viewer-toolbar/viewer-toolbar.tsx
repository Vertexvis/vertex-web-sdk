import { Component, h, Host, Prop } from '@stencil/core';
import classname from 'classnames';

/**
 * Values that define where the toolbar is positioned.
 */
export type ViewerToolbarPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

@Component({
  tag: 'vertex-viewer-toolbar',
  styleUrl: 'viewer-toolbar.css',
  shadow: true,
})
export class ViewerToolbar {
  /**
   * Specifies where the toolbar is positioned. Can be `'top-left' |
   * 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' |
   * 'bottom-right'`. Defaults to `bottom-center`.
   */
  @Prop()
  public position: ViewerToolbarPosition = 'bottom-center';

  public render(): h.JSX.IntrinsicElements {
    const [vertical, horizontal] = this.position.split('-');

    return (
      <Host
        class={classname({
          'position-top': vertical === 'top',
          'position-bottom': vertical === 'bottom',
        })}
      >
        <div
          class={classname('inner', {
            'position-left': horizontal === 'left',
            'position-center': horizontal === 'center',
            'position-right': horizontal === 'right',
          })}
        >
          <slot></slot>
        </div>
      </Host>
    );
  }
}
