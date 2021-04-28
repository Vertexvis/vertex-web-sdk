import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import classnames from 'classnames';

@Component({
  tag: 'vertex-scene-tree-row',
  styleUrl: 'scene-tree-row.css',
  shadow: true,
})
export class SceneTreeRow {
  @Prop()
  public node?: Node.AsObject;

  @Prop()
  public tree?: HTMLVertexSceneTreeElement;

  @Prop()
  public interactionsDisabled = false;

  @Event()
  public expandToggled!: EventEmitter<void>;

  @Event()
  public visibilityToggled!: EventEmitter<void>;

  @Event()
  public selected!: EventEmitter<void>;

  private rootEl?: HTMLElement;
  private expandBtn?: HTMLButtonElement;
  private visibilityBtn?: HTMLButtonElement;

  public render(): h.JSX.IntrinsicElements {
    if (this.node == null) {
      return <div />;
    } else {
      return (
        <div
          class={classnames('root', {
            hidden: !this.node.visible,
            selected: this.node.selected,
            leaf: this.node.isLeaf,
          })}
          ref={(ref) => (this.rootEl = ref)}
          onMouseDown={(event) => this.handleRowMouseDown(event)}
        >
          <div class="no-shrink">
            <slot name="left-gutter" />
          </div>
          <div class="indentation" />
          <button
            class="expand-btn no-shrink"
            ref={(ref) => (this.expandBtn = ref)}
            onMouseDown={() => this.toggleExpansion()}
          >
            {!this.node.isLeaf && (
              <div
                class={classnames('icon', {
                  'icon-expanded': this.node.expanded,
                  'icon-collapsed': !this.node.expanded,
                })}
              />
            )}
          </button>
          <div class="label">
            <slot name="label">{this.node.name}</slot>
          </div>
          <button
            class="visibility-btn no-shrink"
            ref={(ref) => (this.visibilityBtn = ref)}
            onMouseDown={() => this.toggleVisibility()}
          >
            <div
              class={classnames('icon', {
                'icon-visible': this.node.visible,
                'icon-hidden': !this.node.visible,
              })}
            />
          </button>
          <div class="no-shrink">
            <slot name="right-gutter" />
          </div>
        </div>
      );
    }
  }

  protected componentDidRender(): void {
    const { depth = 0 } = this.node || {};
    this.rootEl?.style.setProperty('--depth', `${depth}`);
  }

  private toggleExpansion(): void {
    this.ifNodeDefined((node) => {
      if (!this.interactionsDisabled) {
        this.tree?.toggleExpandItem(node);
        this.expandToggled.emit();
      }
    });
  }

  private toggleVisibility(): void {
    this.ifNodeDefined((node) => {
      if (!this.interactionsDisabled) {
        this.tree?.toggleItemVisibility(node);
        this.visibilityToggled.emit();
      }
    });
  }

  private handleRowMouseDown(event: MouseEvent): void {
    if (
      event.button === 0 &&
      this.isSelectionEvent(event) &&
      !this.interactionsDisabled
    ) {
      if (event.metaKey && this.node?.selected) {
        this.tree?.deselectItem(this.node);
      } else {
        this.tree?.selectItem(this.node, {
          append: event.ctrlKey || event.metaKey,
        });
      }
    }
  }

  private isSelectionEvent(event: MouseEvent): boolean {
    if (event.target != null) {
      return (
        this.rootEl?.contains(event.target as Element) === true &&
        this.expandBtn?.contains(event.target as Element) === false &&
        this.visibilityBtn?.contains(event.target as Element) === false
      );
    } else {
      return false;
    }
  }

  private ifNodeDefined(f: (row: Node.AsObject) => void): void {
    if (this.node != null) {
      f(this.node);
    }
  }
}
