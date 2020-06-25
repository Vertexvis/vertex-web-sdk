import { Prop, Component, h, Host } from '@stencil/core';
import classNames from 'classnames';

@Component({
  tag: 'viewer-toolbar-item',
  styleUrl: 'viewer-toolbar-item.css',
  scoped: true,
})
export class Item {
  /**
   * Whether this element should be displayed with conditional styling for a selected toolbar item.
   */
  @Prop() public selected?: boolean;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="viewer-toolbar-item-root">
          <div
            class={classNames('viewer-toolbar-icon-container', {
              selected: this.selected,
            })}
          >
            <slot />
          </div>
        </div>
      </Host>
    );
  }
}
