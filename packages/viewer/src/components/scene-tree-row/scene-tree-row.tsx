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

  @Prop()
  public interactionsDisabled = false;

  @Event()
  public expandToggled!: EventEmitter<LoadedRow>;

  @Event()
  public visibilityToggled!: EventEmitter<LoadedRow>;

  @Event()
  public selected!: EventEmitter<LoadedRow>;

  private rootEl?: HTMLElement;
  private expandBtn?: HTMLButtonElement;
  private visibilityBtn?: HTMLButtonElement;

  public render(): h.JSX.IntrinsicElements {
    if (this.row == null) {
      return <div />;
    } else {
      return (
        <div
          class={classnames('root', {
            'is-hidden': !this.row.visible,
            'is-selected': this.row.selected,
          })}
          ref={(ref) => (this.rootEl = ref)}
          onMouseDown={(event) => this.handleRowMouseDown(event)}
        >
          <div class="indentation" />
          <button
            class="expand-btn"
            ref={(ref) => (this.expandBtn = ref)}
            onMouseDown={() => this.toggleExpansion()}
          >
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
              ref={(ref) => (this.visibilityBtn = ref)}
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
      if (!this.interactionsDisabled) {
        this.tree?.toggleExpandItem(row);
        this.expandToggled.emit(row);
      }
    });
  }

  private toggleVisibility(): void {
    this.ifRowDefined((row) => {
      if (!this.interactionsDisabled) {
        this.tree?.toggleItemVisibility(row);
        this.visibilityToggled.emit(row);
      }
    });
  }

  private handleRowMouseDown(event: MouseEvent): void {
    if (this.isSelectionEvent(event) && !this.interactionsDisabled) {
      if (event.metaKey && this.row?.selected) {
        this.tree?.deselectItem(this.row);
      } else {
        this.tree?.selectItem(this.row, {
          append: event.ctrlKey || event.metaKey,
        });
      }
    }
  }

  private isSelectionEvent(event: MouseEvent): boolean {
    if (event.target != null) {
      return (
        this.rootEl?.contains(event.target as Node) === true &&
        this.expandBtn?.contains(event.target as Node) === false &&
        this.visibilityBtn?.contains(event.target as Node) === false
      );
    } else {
      return false;
    }
  }

  private ifRowDefined(f: (row: LoadedRow) => void): void {
    if (this.row != null) {
      f(this.row);
    }
  }
}
