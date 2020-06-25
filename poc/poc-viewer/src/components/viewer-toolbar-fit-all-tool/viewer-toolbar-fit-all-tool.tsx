import { h, Component, Prop } from '@stencil/core';
import fitAll from '../../icons/fitAll';

@Component({
  tag: 'viewer-toolbar-fit-all-tool',
})
export class FitAllTool {
  /**
   * The `vertex-viewer` component that this toolbar will interact with.
   * This property can be injected by the `vertex-viewer` when a `data-viewer="{{viewer element id}}"` attribute is present.
   */
  @Prop() public viewer?: HTMLVertexViewerElement;

  public render(): h.JSX.IntrinsicElements {
    return (
      <viewer-toolbar-item onClick={() => this.fitAll()}>
        <svg-icon>{fitAll()}</svg-icon>
      </viewer-toolbar-item>
    );
  }

  private async fitAll(): Promise<void> {
    const scene = await this.viewer?.scene();
    scene
      .camera()
      .viewAll()
      .execute();
  }
}
