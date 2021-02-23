import { Component, h, Prop } from '@stencil/core';
import { ViewerToolbarPlacement } from '../viewer-toolbar/viewer-toolbar';

@Component({
  tag: 'vertex-viewer-default-toolbar',
  styleUrl: 'viewer-default-toolbar.css',
  shadow: true,
})
export class ViewerDefaultToolbar {
  /**
   * An instance of the viewer that operations will be performed on. If
   * contained within a `<vertex-viewer>` element, this property will
   * automatically be wired.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * Specifies where the toolbar is positioned. Can be `'top-left' |
   * 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' |
   * 'bottom-right'`. Defaults to `bottom-center`.
   */
  @Prop()
  public placement: ViewerToolbarPlacement = 'bottom-center';

  /**
   * Indicates whether animations will be used when performing camera
   * operations. Defaults to `true`.
   */
  @Prop()
  public animationsDisabled = false;

  /**
   * The duration of animations, in milliseconds. Defaults to `1000`.
   */
  @Prop()
  public animationMs = 1000;

  public render(): h.JSX.IntrinsicElements {
    return (
      <vertex-viewer-toolbar placement={this.placement}>
        <vertex-viewer-toolbar-group class="group">
          <vertex-viewer-button
            class="group-item btn"
            onClick={() => this.viewAll()}
          >
            <vertex-viewer-icon class="icon" name="fit-all" size="md" />
          </vertex-viewer-button>
        </vertex-viewer-toolbar-group>
      </vertex-viewer-toolbar>
    );
  }

  private async viewAll(): Promise<void> {
    const scene = await this.viewer?.scene();
    const animation = this.animationsDisabled
      ? undefined
      : { milliseconds: this.animationMs };
    scene
      ?.camera()
      .viewAll()
      .render({ animation });
  }
}
