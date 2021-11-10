import {
  Component,
  Host,
  h,
  Prop,
  EventEmitter,
  Event,
  Element,
} from '@stencil/core';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import classNames from 'classnames';

@Component({
  tag: 'vertex-scene-tree-table-cell',
  styleUrl: 'scene-tree-table-cell.css',
  shadow: true,
})
export class SceneTreeTableCell {
  @Prop()
  public tree?: HTMLVertexSceneTreeElement | null;

  @Prop()
  public value?: string;

  @Prop()
  public node?: Node.AsObject;

  @Prop()
  public hoveredNodeId?: string;

  @Prop()
  public expandToggle?: boolean;

  @Prop()
  public visibilityToggle?: boolean;

  @Prop()
  public interactionsDisabled = false;

  @Prop()
  public recurseParentSelectionDisabled = false;

  @Event({ bubbles: true })
  public hovered!: EventEmitter<Node.AsObject | undefined>;

  @Event({ bubbles: true })
  public expansionToggled!: EventEmitter<Node.AsObject>;

  @Event({ bubbles: true })
  public selectionToggled!: EventEmitter<Node.AsObject>;

  @Event({ bubbles: true })
  public visibilityToggled!: EventEmitter<Node.AsObject>;

  @Element()
  private hostEl!: HTMLElement;

  public componentWillRender(): void {
    this.toggleAttribute(
      'is-hovered',
      this.hoveredNodeId === this.node?.id?.hex
    );
    this.toggleAttribute('is-hidden', !this.node?.visible);
    this.toggleAttribute('is-selected', !!this.node?.selected);
    this.toggleAttribute('is-partial', !!this.node?.partiallyVisible);
    this.toggleAttribute('is-leaf', !!this.node?.isLeaf);
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host
        onMouseEnter={() => {
          this.hovered.emit(this.node);
        }}
        onMouseLeave={() => {
          this.hovered.emit(undefined);
        }}
        onPointerDown={this.handleCellPointerDown}
      >
        <div class="wrapper">
          <div class="no-shrink">
            <slot name="left-gutter" />
          </div>
          {this.expandToggle && (
            <button
              class="expand-btn no-shrink"
              data-test-id={'expand-' + this.node?.name}
              onPointerDown={(event) => {
                event.preventDefault();
                this.toggleExpansion();
              }}
            >
              {!this.node?.isLeaf && (
                <div
                  class={classNames('icon', {
                    'icon-expanded': !this.node?.isLeaf && this.node?.expanded,
                    'icon-collapsed':
                      !this.node?.isLeaf && !this.node?.expanded,
                  })}
                />
              )}
            </button>
          )}
          <div class="content">{this.displayValue()}</div>
          {this.visibilityToggle && (
            <button
              class="visibility-btn no-shrink"
              data-test-id={'visibility-btn-' + this.node?.name}
              onPointerDown={(event) => {
                event?.preventDefault();
                this.toggleVisibility();
              }}
            >
              <div
                class={classNames('icon', {
                  'icon-visible':
                    !this.node?.partiallyVisible && this.node?.visible,
                  'icon-hidden':
                    !this.node?.partiallyVisible && !this.node?.visible,
                  'icon-partial': this.node?.partiallyVisible,
                })}
              />
            </button>
          )}
          <div class="no-shrink">
            <slot name="right-gutter" />
          </div>
          {!this.visibilityToggle && <div class="column-spacer" />}
        </div>
      </Host>
    );
  }

  private displayValue = (): string => {
    return this.value == null || this.value.replace(' ', '') === ''
      ? '--'
      : this.value;
  };

  private handleCellPointerDown = (event: PointerEvent): void => {
    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !this.interactionsDisabled
    ) {
      if ((event.ctrlKey || event.metaKey) && this.node?.selected) {
        this.tree?.deselectItem(this.node);
      } else if (this.node?.selected && !this.recurseParentSelectionDisabled) {
        this.tree?.selectItem(this.node, {
          recurseParent: true,
        });
      } else if (!this.node?.selected) {
        this.tree?.selectItem(this.node, {
          append: event.ctrlKey || event.metaKey,
        });
      }
      this.selectionToggled.emit(this.node);
    }
  };

  private toggleExpansion = (): void => {
    if (this.tree != null && this.node != null) {
      this.tree.toggleExpandItem(this.node);
      this.expansionToggled.emit(this.node);
    }
  };

  private toggleVisibility = (): void => {
    if (this.tree != null && this.node != null && !this.interactionsDisabled) {
      this.tree.toggleItemVisibility(this.node);
      this.visibilityToggled.emit(this.node);
    }
  };

  private toggleAttribute(attr: string, value: boolean): void {
    if (value) {
      this.hostEl.setAttribute(attr, '');
    } else {
      this.hostEl.removeAttribute(attr);
    }
  }
}
