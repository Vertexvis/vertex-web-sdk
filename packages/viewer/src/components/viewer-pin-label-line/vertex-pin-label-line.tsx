import {
  Component,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Prop,
} from '@stencil/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Point } from '@vertexvis/geometry';

@Component({
  tag: 'vertex-viewer-pin-label-line',
  styleUrl: 'vertex-pin-label-line.css',
  shadow: false,
})
export class VertexPinLabelLine {
  @Prop()
  public labelEl?: HTMLVertexViewerPinLabelElement;

  @Prop({ mutable: true })
  public pinPoint: Point.Point | undefined;

  @Prop({ mutable: true })
  public labelPoint: Point.Point | undefined;

  protected render(): JSX.Element {
    return (
      <Host>
        <svg class="svg">
          <g>
            <line
              class="label-line"
              x1={this.labelPoint?.x}
              y1={this.labelPoint?.y}
              x2={this.pinPoint?.x}
              y2={this.pinPoint?.y}
            />
          </g>
        </svg>
      </Host>
    );
  }
}
