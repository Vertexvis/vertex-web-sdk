import { h, Component, Prop } from '@stencil/core';
import rotate from '../../icons/rotate';

@Component({
  tag: 'viewer-toolbar-rotate-tool',
})
export class RotateTool {
  /**
   * Whether to display conditional selected state styling to this tool's icon.
   */
  @Prop() public selected?: boolean;

  public render(): h.JSX.IntrinsicElements {
    return (
      <viewer-toolbar-item selected={this.selected}>
        <svg-icon>{rotate()}</svg-icon>
      </viewer-toolbar-item>
    );
  }
}
