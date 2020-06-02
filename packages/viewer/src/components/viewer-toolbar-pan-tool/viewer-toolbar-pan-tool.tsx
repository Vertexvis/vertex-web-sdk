import { h, Component, Prop } from '@stencil/core';
import pan from '../../icons/pan';

@Component({
  tag: 'viewer-toolbar-pan-tool',
})
export class PanTool {
  @Prop() public selected?: boolean;

  public render(): h.JSX.IntrinsicElements {
    return (
      <viewer-toolbar-item selected={this.selected}>
        <svg-icon>{pan()}</svg-icon>
      </viewer-toolbar-item>
    );
  }
}
