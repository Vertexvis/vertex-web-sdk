import {
  Component,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Prop,
} from '@stencil/core';
import { Point } from '@vertexvis/geometry';

import { getPinColors, Pin } from '../../lib/pins/model';

@Component({
  tag: 'vertex-viewer-pin-label-line',
  styleUrl: 'viewer-pin-label-line.css',
  shadow: false,
})
export class VertexPinLabelLine {
  @Prop()
  public pinPoint: Point.Point | undefined;

  @Prop()
  public labelPoint: Point.Point | undefined;

  @Prop()
  public pin: Pin | undefined;

  protected render(): JSX.Element {
    const { primaryColor } = getPinColors(this.pin);

    console.log('primaryColor label-line: ', primaryColor);
    return (
      <Host>
        <svg class="svg">
          <line
            class="label-line"
            style={{
              stroke: primaryColor,
            }}
            x1={this.labelPoint?.x}
            y1={this.labelPoint?.y}
            x2={this.pinPoint?.x}
            y2={this.pinPoint?.y}
          />
        </svg>
      </Host>
    );
  }
}
