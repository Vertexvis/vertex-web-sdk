import { Component, Host, h, State } from '@stencil/core';
import classNames from 'classnames';

@Component({
  tag: 'vertex-scene-tree-table-resize-divider',
  styleUrl: 'scene-tree-table-resize-divider.css',
  shadow: true,
})
export class SceneTreeTableResizeDivider {
  @State()
  private dragging = false;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host
        onPointerDown={this.handlePointerDown}
        style={{
          height: this.dragging ? '100%' : 'var(--header-height)',
          padding: this.dragging
            ? '0 calc(var(--scene-tree-table-column-gap) / 2)'
            : 'calc(var(--header-height) / 8) calc(var(--scene-tree-table-column-gap) / 2)',
        }}
      >
        <slot name="divider">
          <div
            class={classNames('divider', {
              dragging: this.dragging,
            })}
          />
        </slot>
      </Host>
    );
  }

  private handlePointerDown = (): void => {
    this.dragging = true;

    window.addEventListener('pointerup', this.handlePointerUp);
  };

  private handlePointerUp = (): void => {
    this.dragging = false;

    window.removeEventListener('pointerup', this.handlePointerUp);
  };
}
