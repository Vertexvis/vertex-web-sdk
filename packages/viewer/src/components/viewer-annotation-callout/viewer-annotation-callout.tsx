import { Component, h, Host, Prop } from '@stencil/core';

import { CalloutAnnotationData } from '../../lib/annotations/annotation';

@Component({
  tag: 'vertex-viewer-annotation-callout',
  styleUrl: 'viewer-annotation-callout.css',
  shadow: true,
})
export class ViewerAnnotationCallout {
  @Prop() public data!: CalloutAnnotationData;

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div
          class="content"
          style={{
            borderColor: this.data.primaryColor,
            backgroundColor: this.data.accentColor,
          }}
        >
          <vertex-viewer-icon
            class="icon"
            name={this.data.icon}
            size="sm"
            style={{ color: this.data.primaryColor }}
          ></vertex-viewer-icon>
        </div>
      </Host>
    );
  }
}
