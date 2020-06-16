import { h, Component, Prop } from '@stencil/core';
import zoom from '../../icons/zoom';

@Component({
  tag: 'viewer-toolbar-zoom-tool',
})
export class ZoomTool {
  /**
   * Whether to display conditional selected state styling to this tool's icon.
   */
  @Prop() public selected?: boolean;

  public render(): h.JSX.IntrinsicElements {
    return (
      <viewer-toolbar-item selected={this.selected}>
        <svg-icon>{zoom()}</svg-icon>
      </viewer-toolbar-item>
    );
  }
}
