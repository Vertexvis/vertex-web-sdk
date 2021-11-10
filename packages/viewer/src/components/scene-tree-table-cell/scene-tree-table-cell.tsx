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
  /**
   * The node data that is associated to the row that this cell belongs to.
   * Contains information related to if the node is expanded, visible, etc.
   */
  @Prop()
  public node?: Node.AsObject;

  /**
   * A reference to the scene tree to perform operations for interactions. Such
   * as expansion, visibility and selection.
   */
  @Prop()
  public tree?: HTMLVertexSceneTreeElement;

  /**
   * The value to display in this cell.
   */
  @Prop()
  public value?: string;

  /**
   * @internal
   */
  @Prop()
  public hoveredNodeId?: string;

  /**
   * Indicates whether to display a button for toggling the expanded state of
   * the node associated with this cell.
   */
  @Prop()
  public expandToggle?: boolean;

  /**
   * Indicates whether to display a button for toggling the visibility state of
   * the node associated with this cell.
   */
  @Prop()
  public visibilityToggle?: boolean;

  /**
   * A flag that disables the default interactions of this component. If
   * disabled, you can use the event handlers to be notified when certain
   * operations are performed by the user.
   *
   * This prop will be automatically populated based on the `interactionsDisabled` prop
   * specified in the parent `<vertex-scene-tree-table />` element.
   */
  @Prop()
  public interactionsDisabled?: boolean;

  /**
   * A flag that disables selection of the node's parent if the user selects
   * the row multiple times. When enabled, selection of the same row multiple
   * times will recursively select the next unselected parent until the root
   * node is selected.
   *
   * This prop will be automatically populated based on the `recurseParentSelectionDisabled`
   * prop specified in the parent `<vertex-scene-tree-table />` element.
   */
  @Prop()
  public recurseParentSelectionDisabled?: boolean;

  /**
   * @internal
   */
  @Event({ bubbles: true })
  public hovered!: EventEmitter<Node.AsObject | undefined>;

  /**
   * An event that is emitted when a user requests to expand the node. This is
   * emitted even if interactions are disabled.
   */
  @Event({ bubbles: true })
  public expandToggled!: EventEmitter<Node.AsObject>;

  /**
   * An event that is emitted when a user requests to change the node's
   * visibility. This event is emitted even if interactions are disabled.
   */
  @Event({ bubbles: true })
  public visibilityToggled!: EventEmitter<Node.AsObject>;

  /**
   * An event that is emitted when a user requests to change the node's selection
   * state. This event is emitted even if interactions are disabled.
   */
  @Event({ bubbles: true })
  public selectionToggled!: EventEmitter<Node.AsObject>;

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
        onPointerEnter={() => {
          this.hovered.emit(this.node);
        }}
        onPointerLeave={() => {
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
    if (this.tree != null && this.node != null && !this.interactionsDisabled) {
      this.tree.toggleExpandItem(this.node);
    }
    this.expandToggled.emit(this.node);
  };

  private toggleVisibility = (): void => {
    if (this.tree != null && this.node != null && !this.interactionsDisabled) {
      this.tree.toggleItemVisibility(this.node);
    }
    this.visibilityToggled.emit(this.node);
  };

  private toggleAttribute(attr: string, value: boolean): void {
    if (value) {
      this.hostEl.setAttribute(attr, '');
    } else {
      this.hostEl.removeAttribute(attr);
    }
  }
}
