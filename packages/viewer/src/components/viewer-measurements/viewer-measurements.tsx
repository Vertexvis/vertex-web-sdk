import { Component, Host, h, Element, Prop, Watch, State } from '@stencil/core';
import { Point } from '../../../../geometry/dist';
import { DepthBuffer, Viewport } from '../../lib/types';
import { cssTransformCenterAt, getMouseClientPosition } from '../../lib/dom';

export type ViewerMeasurementsTool = 'measure-distance';

@Component({
  tag: 'vertex-viewer-measurements',
  styleUrl: 'viewer-measurements.css',
  shadow: true,
})
export class ViewerMeasurements {
  @Prop()
  public tool: ViewerMeasurementsTool = 'measure-distance';

  @Prop()
  public interactionEnabled = false;

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Prop()
  public depthBuffer?: DepthBuffer;

  @State()
  private internalDepthBuffer?: DepthBuffer;

  @State()
  private newMeasurementPoint?: Point.Point;

  @State()
  private elementBounds?: DOMRect;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @Element()
  private hostEl!: HTMLElement;

  protected componentDidLoad(): void {
    this.handleViewerChanged(this.viewer);
    this.updateBounds();
  }

  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div class="measurement"></div>
        <slot></slot>
      </Host>
    );
  }

  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleFrameDrawn);
    this.handleFrameDrawn();
  }

  private handleFrameDrawn = async (): Promise<void> => {
    this.internalDepthBuffer =
      this.depthBuffer ?? (await this.viewer?.frame?.depthBuffer());
  };

  private updateBounds(): void {
    this.elementBounds = this.hostEl.getBoundingClientRect();
    this.viewport = new Viewport(
      this.elementBounds.width,
      this.elementBounds.height
    );
  }
}
