import { Component, h, Host, State } from '@stencil/core';
import classNames from 'classnames';

@Component({
  tag: 'vertex-scene-tree-table-resize-divider',
  styleUrl: 'scene-tree-table-resize-divider.css',
  shadow: true,
})
export class SceneTreeTableResizeDivider {
  @State()
  private hovering = false;

  @State()
  private dragging = false;

  public render(): h.JSX.IntrinsicElements {
    const isHighlighted = !!this.hovering || !!this.dragging;

    return (
      <Host
        onPointerDown={this.handlePointerDown}
        onPointerEnter={this.handleCellPointerEnter}
        onPointerLeave={this.handleCellPointerLeave}
        style={{
          height: isHighlighted ? '100%' : 'var(--header-height)',
          padding: isHighlighted
            ? '0 calc(var(--scene-tree-table-column-gap) / 2)'
            : 'calc(var(--header-height) / 8) calc(var(--scene-tree-table-column-gap) / 2)',
        }}
      >
        <slot name="divider">
          <div
            class={classNames('divider', {
              highlighted: isHighlighted,
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

  private handleCellPointerEnter = (): void => {
    this.hovering = true;
  };

  private handleCellPointerLeave = (): void => {
    this.hovering = false;
  };
}
