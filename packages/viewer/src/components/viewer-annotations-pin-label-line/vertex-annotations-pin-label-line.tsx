import {
  Component,
  Element,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h,
  Host,
  Prop,
  Watch,
} from '@stencil/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { Pin } from '../../lib/pins/entities';

@Component({
  tag: 'vertex-viewer-annotations-pin-label-line',
  styleUrl: 'vertex-annotations-pin-label-line.css',
  shadow: true,
})
export class VertexAnnotationsPinLabelLine {
  @Prop()
  public labelEl?: HTMLVertexViewerAnnotationsPinLabelElement;

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

  /**
   * The viewer that this component is bound to. This is automatically assigned
   * if added to the light-dom of a parent viewer element.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Element()
  private hostEl!: HTMLElement;

  protected componentDidLoad(): void {
    console.log('testing: ', this.labelEl);
    const resize = new ResizeObserver(() => this.computeLabelDimensions());

    const pinLabel = this.hostEl.shadowRoot?.getElementById(
      `pin-label-${this.pin?.id}`
    );

    if (pinLabel != null) {
      this.labelEl = pinLabel as HTMLVertexViewerAnnotationsPinLabelElement;
      resize.observe(this.labelEl);
    }

    this.computeLabelDimensions();
  }

  /**
   * @ignore
   */
  @Watch('labelEl')
  protected handleLabelElChanged(): void {
    console.log('label changed: ', this.labelEl);
  }

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
              // style={{
              //   stroke: `rgb(255,0,0)`,
              //   'stroke-width': '2',
              // }}
            />
          </g>
        </svg>
      </Host>
    );
  }

  private computeLabelDimensions(): void {
    const pinLabel =
      this.labelEl || document.getElementById(`pin-label-${this.pin?.id}`);

    console.log('docment.get', this.hostEl.shadowRoot);
    console.log('TESTING:');
    if (pinLabel) {
      this.pinLabelDimensions = {
        height: pinLabel.offsetHeight,
        width: pinLabel.offsetWidth,
      };

      this.labelEl = pinLabel as HTMLVertexViewerAnnotationsPinLabelElement;

      console.log('TESTING: labelDimensions: ', this.pinLabelDimensions);
    }
  }
}
