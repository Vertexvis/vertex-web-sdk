import { Component, h, Host, Prop } from '@stencil/core';
import classNames from 'classnames';

import { CalloutAnnotationData } from '../../lib/annotations/annotation';
import { ViewerIconSize } from '../viewer-icon/viewer-icon';

@Component({
  tag: 'vertex-viewer-annotation-callout',
  styleUrl: 'viewer-annotation-callout.css',
  shadow: true,
})
export class ViewerAnnotationCallout {
  /**
   * The data that describes how to render the callout annotation.
   */
  @Prop() public data!: CalloutAnnotationData;

  /**
   * The icon size to display.
   */
  @Prop() public iconSize: ViewerIconSize = 'sm';

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div
          class={classNames('content', this.iconSize)}
          style={{
            borderColor: this.data.primaryColor,
            backgroundColor: this.data.accentColor,
          }}
        >
          <vertex-viewer-icon
            class="icon"
            name={this.data.icon}
            size={this.iconSize}
            style={{ color: this.data.primaryColor }}
          ></vertex-viewer-icon>
        </div>
      </Host>
    );
  }
}
