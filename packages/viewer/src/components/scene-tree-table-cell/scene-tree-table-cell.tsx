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
import { Disposable } from '@vertexvis/utils';
import classNames from 'classnames';

import { SceneTreeCellHoverController } from '../scene-tree-table-layout/lib/hover-controller';

export interface SceneTreeTableCellEventDetails {
  node?: Node.AsObject;
  originalEvent: PointerEvent;
}

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
   * The value to display in this cell if the `value` specified is
   * undefined. Defaults to "--".
   */
  @Prop()
  public placeholder = '--';

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public hovered = false;

  /**
   * @internal
   */
  @Prop()
  public isScrolling?: boolean;

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
   */
  @Prop()
  public interactionsDisabled = false;

  /**
   * A flag that disables selection of the node's parent if the user selects
   * the row multiple times. When enabled, selection of the same row multiple
   * times will recursively select the next unselected parent until the root
   * node is selected.
   */
  @Prop()
  public recurseParentSelectionDisabled = false;

  /**
   * @internal
   */
  @Prop()
  public hoverController?: SceneTreeCellHoverController;

  /**
   * An event that is emitted when a user requests to expand the node. This is
   * emitted even if interactions are disabled.
   */
  @Event({ bubbles: true })
  public expandToggled!: EventEmitter<SceneTreeTableCellEventDetails>;

  /**
   * An event that is emitted when a user requests to change the node's
   * visibility. This event is emitted even if interactions are disabled.
   */
  @Event({ bubbles: true })
  public visibilityToggled!: EventEmitter<SceneTreeTableCellEventDetails>;

  /**
   * An event that is emitted when a user requests to change the node's selection
   * state. This event is emitted even if interactions are disabled.
   */
  @Event({ bubbles: true })
  public selectionToggled!: EventEmitter<SceneTreeTableCellEventDetails>;

  @Element()
  private hostEl!: HTMLElement;

  private hoverListener?: Disposable;

  public componentDidLoad(): void {
    this.hoverListener = this.hoverController?.stateChanged((id?: string) => {
      this.hovered = id === this.node?.id?.hex;
    });
  }

  public disconnectedCallback(): void {
    this.hoverListener?.dispose();
  }

  public componentWillRender(): void {
    this.toggleAttribute('is-hovered', this.hovered);
    this.toggleAttribute('is-hidden', !this.node?.visible);
    this.toggleAttribute('is-selected', !!this.node?.selected);
    this.toggleAttribute('is-partial', !!this.node?.partiallyVisible);
    this.toggleAttribute('is-leaf', !!this.node?.isLeaf);
    this.toggleAttribute('is-filter-hit', !!this.node?.filterHit);
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host
        onPointerEnter={this.handleCellPointerEnter}
        onPointerLeave={this.handleCellPointerLeave}
        onPointerUp={this.handleCellPointerUp}
      >
        <div class="wrapper">
          <div class="no-shrink">
            <slot name="left-gutter" />
          </div>
          {this.expandToggle && (
            <button
              class="expand-btn no-shrink"
              data-test-id={'expand-' + this.node?.name}
              onPointerUp={(event) => {
                event.preventDefault();
                this.toggleExpansion(event);
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

          <div class="content">
            {this.value != null && this.value.trim() !== '' ? (
              <slot>{this.displayValue()}</slot>
            ) : (
              <slot name="placeholder">{this.placeholder}</slot>
            )}
          </div>
          {this.visibilityToggle && (
            <button
              class="visibility-btn no-shrink"
              data-test-id={'visibility-btn-' + this.node?.name}
              onPointerUp={(event) => {
                event?.preventDefault();
                this.toggleVisibility(event);
              }}
            >
              <div
                class={classNames('icon', {
                  'icon-visible':
                    this.hovered &&
                    !this.node?.partiallyVisible &&
                    this.node?.visible,
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
    const resp =
      this.value == null || this.value.trim() === ''
        ? this.placeholder
        : this.value;

    return resp;
  };

  private handleCellPointerEnter = (): void => {
    this.hoverController?.setHovered(this.node?.id?.hex);
  };

  private handleCellPointerLeave = (): void => {
    this.hoverController?.setHovered(undefined);
  };

  private handleCellPointerUp = (event: PointerEvent): void => {
    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !this.interactionsDisabled &&
      !this.isScrolling
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
          range: event.shiftKey,
        });
      }
      this.selectionToggled.emit({ node: this.node, originalEvent: event });
    }
  };

  private toggleExpansion = (event: PointerEvent): void => {
    if (this.tree != null && this.node != null && !this.interactionsDisabled) {
      this.tree.toggleExpandItem(this.node);
    }
    this.expandToggled.emit({ node: this.node, originalEvent: event });
  };

  private toggleVisibility = (event: PointerEvent): void => {
    if (this.tree != null && this.node != null && !this.interactionsDisabled) {
      this.tree.toggleItemVisibility(this.node);
    }
    this.visibilityToggled.emit({ node: this.node, originalEvent: event });
  };

  private toggleAttribute(attr: string, value: boolean): void {
    if (value) {
      this.hostEl.setAttribute(attr, '');
    } else {
      this.hostEl.removeAttribute(attr);
    }
  }
}
