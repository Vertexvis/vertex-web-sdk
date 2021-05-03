import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
} from '@stencil/core';
import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';
import classnames from 'classnames';

/**
 * A `<vertex-scene-tree-row>` component that is responsible for rendering a row
 * within a `<vertex-scene-tree>`.
 *
 * @slot left-gutter An HTML element that is placed at the left side of the row,
 * before the indentation and expansion button.
 *
 * @slot label An HTML element to replace the default label provided by the
 * component. Can be used to customize the content between the expansion and
 * visibility buttons.
 *
 * @slot right-gutter An HTML element that is placed at the right side of the
 * row, after the visibility button.
 */
@Component({
  tag: 'vertex-scene-tree-row',
  styleUrl: 'scene-tree-row.css',
  shadow: true,
})
export class SceneTreeRow {
  /**
   * The node data that is associated to the row. Contains information related
   * to if the node is expanded, visible, etc.
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
   * A flag that disables the default interactions of this component. If
   * disabled, you can use the event handlers to be notified when certain
   * operations are performed by the user.
   */
  @Prop()
  public interactionsDisabled = false;

  /**
   * An event that is emitted when a user requests to expand the node. This is
   * emitted even if interactions are disabled.
   */
  @Event()
  public expandToggled!: EventEmitter<void>;

  /**
   * An event that is emitted when a user requests to change the node's
   * visibility. This event is emitted even if interactions are disabled.
   */
  @Event()
  public visibilityToggled!: EventEmitter<void>;

  /**
   * An event that is emitted when a user requests to change the node's selection
   * state. This event is emitted even if interactions are disabled.
   */
  @Event()
  public selectionToggled!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  private rootEl?: HTMLElement;

  public render(): h.JSX.IntrinsicElements {
    if (this.node == null) {
      return <div />;
    } else {
      return (
        <Host
          class={classnames({
            hidden: !this.node.visible,
            selected: this.node.selected,
            leaf: this.node.isLeaf,
          })}
        >
          <div class="root" ref={(ref) => (this.rootEl = ref)}>
            <div class="no-shrink">
              <slot name="left-gutter" />
            </div>
            <div class="indentation" />
            <button
              class="expand-btn no-shrink"
              onMouseDown={(event) => {
                event.preventDefault();
                this.toggleExpansion();
              }}
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
              onMouseDown={(event) => {
                event?.preventDefault();
                this.toggleVisibility();
              }}
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
        </Host>
      );
    }
  }

  /**
   * @internal
   */
  protected componentDidLoad(): void {
    this.hostEl.addEventListener('mousedown', (event) =>
      this.handleRowMouseDown(event)
    );
  }

  /**
   * @internal
   */
  protected componentDidRender(): void {
    const { depth = 0 } = this.node || {};
    this.rootEl?.style.setProperty('--depth', `${depth}`);
  }

  private toggleExpansion(): void {
    this.ifNodeDefined((node) => {
      if (!this.interactionsDisabled) {
        this.tree?.toggleExpandItem(node);
      }
      this.expandToggled.emit();
    });
  }

  private toggleVisibility(): void {
    this.ifNodeDefined((node) => {
      if (!this.interactionsDisabled) {
        this.tree?.toggleItemVisibility(node);
      }
      this.visibilityToggled.emit();
    });
  }

  private handleRowMouseDown(event: MouseEvent): void {
    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !this.interactionsDisabled
    ) {
      if ((event.ctrlKey || event.metaKey) && this.node?.selected) {
        this.tree?.deselectItem(this.node);
      } else {
        this.tree?.selectItem(this.node, {
          append: event.ctrlKey || event.metaKey,
        });
      }
      this.selectionToggled.emit();
    }
  }

  private ifNodeDefined(f: (row: Node.AsObject) => void): void {
    if (this.node != null) {
      f(this.node);
    }
  }
}
