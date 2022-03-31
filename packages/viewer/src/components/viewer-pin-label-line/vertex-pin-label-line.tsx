import {
  Component,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Prop,
  Watch,
} from '@stencil/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dimensions, Point } from '@vertexvis/geometry';

import { Pin } from '../../lib/pins/entities';

@Component({
  tag: 'vertex-viewer-pin-label-line',
  styleUrl: 'vertex-pin-label-line.css',
  shadow: false,
})
export class VertexPinLabelLine {
  @Prop()
  public labelEl?: HTMLVertexViewerPinLabelElement;

  /**
   * The pin to draw for the group
   */
  @Prop({ mutable: true })
  public pin?: Pin;

  /**
   * The dimensions of the the pin label
   */
  @Prop({ mutable: true })
  public pinLabelDimensions: Dimensions.Dimensions = { height: 0, width: 0 };

  @Prop({ mutable: true })
  public pinPoint: Point.Point | undefined;

  @Prop({ mutable: true })
  public labelPoint: Point.Point | undefined;

  protected render(): JSX.Element {
    if (this.labelEl == null) {
      this.computeLabelDimensions();
    }
    if (this.pin == null || this.labelPoint == null || this.pinPoint == null) {
      throw new Error('Unable to render pin');
    }

    return (
      <Host>
        <svg class="svg">
          <g>
            <line
              id={`pin-label-line-${this.pin.id}`}
              class="label-line"
              x1={this.labelPoint.x}
              y1={this.labelPoint.y}
              x2={this.pinPoint.x}
              y2={this.pinPoint.y}
            />
          </g>
        </svg>
      </Host>
    );
  }

  private computeLabelDimensions(): void {
    const pinLabel =
      this.labelEl || document.getElementById(`pin-label-${this.pin?.id}`);
    if (pinLabel) {
      this.pinLabelDimensions = {
        height: pinLabel.offsetHeight,
        width: pinLabel.offsetWidth,
      };

      this.labelEl = pinLabel as HTMLVertexViewerPinLabelElement;
    }
  }
}
