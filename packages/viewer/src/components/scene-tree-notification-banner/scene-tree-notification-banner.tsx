import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

/**
 * A notification banner that displays a message and an action button.
 */
@Component({
  tag: 'vertex-scene-tree-notification-banner',
  styleUrl: 'scene-tree-notification-banner.css',
  shadow: true,
})
export class SceneTreeNotificationBanner {
  /**
   * The message to display in the banner.
   */
  @Prop()
  public message?: string;

  /**
   * The label of the action button.
   */
  @Prop()
  public actionLabel?: string;

  /**
   * An event that is emitted when the action button is clicked.
   */
  @Event()
  public action!: EventEmitter<void>;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="notification-banner">
          <div class="notification-banner-info">
            <vertex-viewer-icon class="icon" name="info" size="sm" />
            <p>{this.message}</p>
          </div>
          {this.actionLabel != null && (
            <div class="notification-banner-actions">
              <button
                class="notification-banner-button"
                onClick={() => this.action.emit()}
              >
                {this.actionLabel}
              </button>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
