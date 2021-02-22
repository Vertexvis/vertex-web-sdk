import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'vertex-viewer-default-toolbar',
  styleUrl: 'viewer-default-toolbar.css',
  shadow: true,
})
export class ViewerDefaultToolbar {
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  public render(): h.JSX.IntrinsicElements {
    return (
      <vertex-viewer-toolbar>
        <vertex-viewer-toolbar-group>
          <vertex-viewer-button onClick={() => this.viewAll()}>
            Fit All
          </vertex-viewer-button>
        </vertex-viewer-toolbar-group>
      </vertex-viewer-toolbar>
    );
  }

  private async viewAll(): Promise<void> {
    const scene = await this.viewer?.scene();
    scene
      ?.camera()
      .viewAll()
      .render();
  }
}
