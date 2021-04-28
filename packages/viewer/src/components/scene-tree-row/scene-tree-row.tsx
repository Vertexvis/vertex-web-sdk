import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import classnames from 'classnames';
import { writeDOM } from '../../utils/stencil';
import { LoadedRow, Row } from '../scene-tree/lib/row';

@Component({
  tag: 'vertex-scene-tree-row',
  styleUrl: 'scene-tree-row.css',
  shadow: true,
})
export class SceneTreeRow {
  @Prop()
  public row?: LoadedRow;

  @Prop()
  public tree?: HTMLVertexSceneTreeElement;

  @Event()
  public expandToggled!: EventEmitter<LoadedRow>;

  @Event()
  public visibilityToggled!: EventEmitter<LoadedRow>;

  @Event()
  public selected!: EventEmitter<LoadedRow>;

  private rootEl?: HTMLElement;

  public render(): h.JSX.IntrinsicElements {
    if (this.row == null) {
      return <div />;
    } else {
      return (
        <div
          class={classnames('root', { 'is-hidden': !this.row.visible })}
          ref={(ref) => (this.rootEl = ref)}
        >
          <div class="indentation" />
          <button class="expand-btn" onMouseDown={() => this.toggleExpansion()}>
            {!this.row.isLeaf && (
              <div
                class={classnames('icon', {
                  'icon-expanded': this.row.expanded,
                  'icon-collapsed': !this.row.expanded,
                })}
              />
            )}
          </button>
          <div class="label">{this.row.name}</div>
          <div class="right-gutter">
            <button
              class="visibility-btn"
              onMouseDown={() => this.toggleVisibility()}
            >
              <div
                class={classnames('icon', {
                  'icon-visible': this.row.visible,
                  'icon-hidden': !this.row.visible,
                })}
              />
            </button>
          </div>
        </div>
      );
    }
  }

  protected componentShouldUpdate(
    oldValue: unknown,
    newValue: unknown,
    prop: string
  ): boolean {
    if (prop === 'row') {
      const oldRow = oldValue as Row;
      const newRow = newValue as Row;

      return (
        oldRow?.name !== newRow?.name ||
        oldRow?.selected !== newRow?.selected ||
        oldRow?.visible !== newRow?.visible ||
        oldRow?.isLeaf !== newRow?.isLeaf ||
        oldRow?.expanded !== newRow?.expanded ||
        oldRow?.depth !== newRow?.depth
      );
    } else {
      return false;
    }
  }

  protected componentDidRender(): void {
    writeDOM(() => {
      const { depth = 0 } = this.row || {};
      this.rootEl?.style.setProperty('--depth', `${depth}`);
    });
  }

  private toggleExpansion(): void {
    this.ifRowDefined((row) => {
      this.tree?.toggleExpandItem(row);
      this.expandToggled.emit(row);
    });
  }

  private toggleVisibility(): void {
    this.ifRowDefined((row) => {
      this.tree?.toggleItemVisibility(row);
      this.visibilityToggled.emit(row);
    });
  }

  private ifRowDefined(f: (row: LoadedRow) => void): void {
    if (this.row != null) {
      f(this.row);
    }
  }
}
