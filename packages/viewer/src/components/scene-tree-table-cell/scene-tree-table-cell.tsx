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

import { Events } from '../../lib/types';
import { SceneTreeOperationHandler } from '../scene-tree/lib/handlers';
import { SceneTreeCellHoverController } from '../scene-tree-table-layout/lib/hover-controller';
import { ViewerIconName } from '../viewer-icon/viewer-icon';
import { blurElement } from './utils';

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
   * Whether to always show the requested icons in the cell. If false,
   * the icons will only appear when hovering over the cell.
   */
  @Prop()
  public alwaysShowIcons = false;

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
   * Indicates whether to display an indicator that the node associated with
   * this cell is an end item.
   */
  @Prop()
  public endItemIndicator?: boolean;

  /**
   * Indicates whether to display a button for toggling the visibility state of
   * the node associated with this cell.
   */
  @Prop()
  public visibilityToggle?: boolean;

  /**
   * Indicates whether to display a button for isolating (show only + fly to)
   * the node associated with this cell.
   */
  @Prop()
  public isolateButton?: boolean;

  /**
   * An optional handler that will override this cell's default selection
   * behavior. The registered handler will receive the `pointerup` event,
   * the node data for the row this cell is associated with, and a reference
   * to the parent `<vertex-scene-tree>` element for performing operations.
   */
  @Prop()
  public selectionHandler?: SceneTreeOperationHandler;

  /**
   * An optional handler that will override this cell's default visibility
   * behavior. The registered handler will receive the `pointerup` event,
   * the node data for the row this cell is associated with, and a reference
   * to the parent `<vertex-scene-tree>` element for performing operations.
   */
  @Prop()
  public visibilityHandler?: SceneTreeOperationHandler;

  /**
   * An optional handler that will override this cell's default expansion
   * behavior. The registered handler will receive the `pointerup` event,
   * the node data for the row this cell is associated with, and a reference
   * to the parent `<vertex-scene-tree>` element for performing operations.
   */
  @Prop()
  public expansionHandler?: SceneTreeOperationHandler;

  /**
   * An optional handler that will override this cell's default isolate
   * behavior. The registered handler will receive the `pointerup` event,
   * the node data for the row this cell is associated with, and a reference
   * to the parent `<vertex-scene-tree>` element for performing operations.
   */
  @Prop()
  public isolateHandler?: SceneTreeOperationHandler;

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

  /**
   * An event that is emitted when a user requests to isolate the node.
   * This event is emitted even if interactions are disabled.
   */
  @Event({ bubbles: true })
  public isolatePressed!: EventEmitter<SceneTreeTableCellEventDetails>;

  /**
   * Used for internals or testing.
   *
   * @private
   */
  @Event({ bubbles: true })
  public cellLoaded!: EventEmitter<void>;

  @Element()
  private hostEl!: HTMLElement;

  private hoverListener?: Disposable;

  private longPressTimer?: number;

  public componentDidLoad(): void {
    this.hoverListener = this.hoverController?.stateChanged((id?: string) => {
      this.hovered = id === this.node?.id?.hex;
    });

    this.cellLoaded.emit();
    this.clearLongPressTimer();
  }

  public disconnectedCallback(): void {
    this.hoverListener?.dispose();
    this.clearLongPressTimer();
  }

  public componentWillRender(): void {
    this.toggleAttribute('is-hovered', this.hovered);
    this.toggleAttribute('is-hidden', !this.node?.visible);
    this.toggleAttribute('is-selected', !!this.node?.selected);
    this.toggleAttribute('is-partial', !!this.node?.partiallyVisible);
    this.toggleAttribute('is-leaf', !!this.node?.isLeaf);
    this.toggleAttribute('is-end-item', !!this.node?.endItem);
    this.toggleAttribute('is-filter-hit', !!this.node?.filterHit);
  }

  public render(): h.JSX.IntrinsicElements {
    // Overrides the `.hydrated` visibility when we have nothing to display
    const hiddenStyle =
      this.node == null ? { visibility: 'hidden' } : undefined;
    const backgroundColorStyle = this.getBackgroundColorStyle();

    const endItemIcon = this.getEndItemIcon();
    const expansionIcon = this.getExpansionIcon();
    const isolateIcon = this.getIsolateIcon();
    const visibilityIcon = this.getVisibilityIcon();

    const showSpaceForExpansionIcon = this.expandToggle && !endItemIcon;
    const showSpaceForEndItemIcon = endItemIcon && !showSpaceForExpansionIcon;

    return (
      <Host
        onPointerEnter={this.handleCellPointerEnter}
        onPointerLeave={this.handleCellPointerLeave}
        onPointerUp={this.handleCellPointerUp}
        onPointerDown={this.handleCellPointerDown}
        style={{
          ...hiddenStyle,
          'background-color': backgroundColorStyle,
        }}
      >
        <div class="wrapper">
          <div class="no-shrink">
            <slot name="left-gutter" />
          </div>
          {showSpaceForExpansionIcon && (
            <button
              class="expand-btn no-shrink"
              data-test-id={'expand-' + this.node?.name}
              onPointerUp={this.createActionPointerUpHandler(
                this.toggleExpansion
              )}
            >
              {expansionIcon && (
                <vertex-viewer-icon
                  class="icon"
                  name={expansionIcon}
                  size="sm"
                />
              )}
            </button>
          )}

          {showSpaceForEndItemIcon && (
            <button
              class="end-item-btn no-shrink"
              data-test-id={'end-item-' + this.node?.name}
            >
              {endItemIcon && (
                <vertex-viewer-icon class="icon" name={endItemIcon} size="sm" />
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
          {this.isolateButton && (
            <button
              class="isolate-btn no-shrink"
              data-test-id={'isolate-btn-' + this.node?.name}
              onPointerUp={this.createActionPointerUpHandler(this.isolate)}
            >
              {isolateIcon && (
                <vertex-viewer-icon class="icon" name="locate" size="sm" />
              )}
            </button>
          )}
          {this.visibilityToggle && (
            <button
              class="visibility-btn no-shrink"
              data-test-id={'visibility-btn-' + this.node?.name}
              onPointerUp={this.createActionPointerUpHandler(
                this.toggleVisibility
              )}
            >
              {visibilityIcon && (
                <vertex-viewer-icon
                  class="icon"
                  name={visibilityIcon}
                  size="sm"
                />
              )}
            </button>
          )}
          <div class="no-shrink">
            <slot name="right-gutter" />
          </div>
          {!this.visibilityToggle && !this.isolateButton && (
            <div class="column-spacer" />
          )}
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
      !this.isScrolling &&
      this.node != null &&
      this.tree != null &&
      this.longPressTimer != null
    ) {
      if (this.selectionHandler != null) {
        this.selectionHandler(event, this.node, this.tree);
      } else {
        this.performDefaultSelectionOperation(event);
      }
      this.selectionToggled.emit({ node: this.node, originalEvent: event });
    }
    this.clearLongPressTimer();
  };

  private handleCellPointerDown = (event: PointerEvent): void => {
    this.restartLongPressTimer();
  };

  private createActionPointerUpHandler = (
    action: (event: PointerEvent) => void
  ): ((event: PointerEvent) => void) => {
    return (event) => {
      // Blur the `hostEl` after a `preventDefault` to clear focus that
      // is left on the element after `pointerdown` event.
      event.preventDefault();
      blurElement(this.hostEl);

      action(event);
    };
  };

  private toggleExpansion = async (event: PointerEvent): Promise<void> => {
    if (this.tree != null && this.node != null) {
      if (this.expansionHandler != null) {
        this.expansionHandler(event, this.node, this.tree);
      } else {
        await this.performDefaultExpansionOperation(this.node, this.tree);
      }
      this.expandToggled.emit({ node: this.node, originalEvent: event });
    }
  };

  private toggleVisibility = async (event: PointerEvent): Promise<void> => {
    if (this.tree != null && this.node != null) {
      if (this.visibilityHandler != null) {
        this.visibilityHandler(event, this.node, this.tree);
      } else {
        await this.performDefaultVisibilityOperation(this.node, this.tree);
      }
      this.visibilityToggled.emit({ node: this.node, originalEvent: event });
    }
  };

  private toggleAttribute(attr: string, value: boolean): void {
    if (value) {
      this.hostEl.setAttribute(attr, '');
    } else {
      this.hostEl.removeAttribute(attr);
    }
  }

  private isolate = async (event: PointerEvent): Promise<void> => {
    if (this.tree != null && this.node != null) {
      if (this.isolateHandler != null) {
        this.isolateHandler(event, this.node, this.tree);
      } else {
        await this.performDefaultIsolateOperation(this.node, this.tree);
      }
      this.isolatePressed.emit({ node: this.node, originalEvent: event });
    }
  };

  private performDefaultSelectionOperation = (event: PointerEvent): void => {
    if (!event.defaultPrevented && event.button === 0) {
      if ((event.ctrlKey || event.metaKey) && this.node?.selected) {
        this.tree?.deselectItem(this.node);
      } else if (this.node?.selected) {
        this.tree?.selectItem(this.node, {
          recurseParent: true,
        });
      } else if (!this.node?.selected) {
        this.tree?.selectItem(this.node, {
          append: event.ctrlKey || event.metaKey,
          range: event.shiftKey,
        });
      }
    }
  };

  private performDefaultVisibilityOperation = async (
    node: Node.AsObject,
    tree: HTMLVertexSceneTreeElement
  ): Promise<void> => {
    await tree.toggleItemVisibility(node);
  };

  private performDefaultIsolateOperation = async (
    node: Node.AsObject,
    tree: HTMLVertexSceneTreeElement
  ): Promise<void> => {
    await tree.isolateItem(node);
  };

  private performDefaultExpansionOperation = async (
    node: Node.AsObject,
    tree: HTMLVertexSceneTreeElement
  ): Promise<void> => {
    await tree.toggleExpandItem(node);
  };

  private clearLongPressTimer(): void {
    if (this.longPressTimer != null) {
      window.clearTimeout(this.longPressTimer);
    }
    this.longPressTimer = undefined;
  }

  private restartLongPressTimer(): void {
    this.clearLongPressTimer();
    this.longPressTimer = window.setTimeout(() => {
      this.clearLongPressTimer();
    }, Events.defaultEventConfig.longPressThreshold);
  }

  private getBackgroundColorStyle(): string {
    const backgroundColorStyle = this.getCssVariableWithFallbacks(
      `--scene-tree-row-background-color-depth-${this.node?.depth}`,
      '--scene-tree-row-background-color'
    );
    const selectedBackgroundColorStyle = this.getCssVariableWithFallbacks(
      '--scene-tree-selected-row-background-color',
      '--scene-tree-cell-background-selected'
    );
    const hoveredBackgroundColorStyle = this.getCssVariableWithFallbacks(
      '--scene-tree-hovered-row-background-color',
      '--scene-tree-cell-background-hover'
    );

    if (!!this.node?.selected) {
      return selectedBackgroundColorStyle;
    } else if (this.hovered) {
      return hoveredBackgroundColorStyle;
    }
    return backgroundColorStyle;
  }

  private getCssVariableWithFallbacks(
    variable: string,
    ...fallbacks: string[]
  ): string {
    const sequencedFallbacks = [...fallbacks].reverse();

    return [...sequencedFallbacks, variable].reduce(
      (res, s) => `var(${s}, ${res})`,
      'unset'
    );
  }

  private getIsolateIcon(): ViewerIconName | undefined {
    if (this.hovered || this.alwaysShowIcons) {
      return 'locate';
    }
    return undefined;
  }

  private getExpansionIcon(): ViewerIconName | undefined {
    if (!this.node?.isLeaf && !this.node?.endItem) {
      return this.node?.expanded ? 'chevron-down' : 'chevron-right';
    }
    return undefined;
  }

  private getEndItemIcon(): ViewerIconName | undefined {
    if (this.endItemIndicator && this.node?.endItem) {
      return 'lock';
    }
    return undefined;
  }

  private getVisibilityIcon(): ViewerIconName | undefined {
    if (
      (this.hovered || this.alwaysShowIcons) &&
      !this.node?.partiallyVisible &&
      this.node?.visible
    ) {
      return 'eye-open';
    } else if (!this.node?.partiallyVisible && !this.node?.visible) {
      return 'eye-half';
    } else if (this.node?.partiallyVisible) {
      return 'eye-half-dotted';
    }
    return undefined;
  }
}
