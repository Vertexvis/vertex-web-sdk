import { Component, Element, h, Host, Prop, Watch } from '@stencil/core';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';

import { readDOM, writeDOM } from '../../lib/stencil';
import { HitIndicator } from './lib/indicator';

@Component({
  tag: 'vertex-viewer-hit-result-indicator',
  styleUrl: 'viewer-hit-result-indicator.css',
  shadow: true,
})
export class ViewerHitResultIndicator {
  /**
   * The viewer to connect to transforms. If nested within a <vertex-viewer>,
   * this property will be populated automatically.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The starting position of this transform widget. This position will be updated
   * as transforms occur. Setting this value to `undefined` will remove the widget.
   */
  @Prop({ mutable: true })
  public position?: Vector3.Vector3;

  @Prop({ mutable: true })
  public normal?: Vector3.Vector3;

  @Element()
  private hostEl!: HTMLElement;

  private transform?: Matrix4.Matrix4;

  private arrowColor: Color.Color | string = '#ffffff';
  private planeColor: Color.Color | string = '#00ffff';
  private planeOpacity: number | string = 0.5;

  private indicator?: HitIndicator;

  private canvasBounds?: DOMRect;
  private canvasResizeObserver?: ResizeObserver;
  private canvasRef?: HTMLCanvasElement;

  protected componentDidLoad(): void {
    this.handleViewerChanged(this.viewer, undefined);

    this.canvasResizeObserver = new ResizeObserver(this.handleResize);

    if (this.canvasRef != null) {
      this.canvasResizeObserver.observe(this.canvasRef);

      this.setupIndicator(this.canvasRef);
    }

    readDOM(() => {
      const hostStyles = window.getComputedStyle(this.hostEl);

      this.arrowColor = hostStyles
        .getPropertyValue('--viewer-hit-result-indicator-arrow-color')
        .trim()
        .replace('"', '')
        .replace('"', '');
      this.planeColor = hostStyles
        .getPropertyValue('--viewer-hit-result-indicator-plane-color')
        .trim()
        .replace('"', '')
        .replace('"', '');
      this.planeOpacity = hostStyles
        .getPropertyValue('--viewer-hit-result-indicator-plane-opacity')
        .trim()
        .replace('"', '')
        .replace('"', '');

      this.indicator?.updateColors({
        arrow: this.arrowColor,
        plane: this.planeColor,
      });
    });
  }

  protected disconnectedCallback(): void {
    this.canvasResizeObserver?.disconnect();

    this.indicator?.dispose();
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleViewerFrameDrawn);
    oldViewer?.removeEventListener(
      'dimensionschange',
      this.handleViewerDimensionsChange
    );
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener(
      'dimensionschange',
      this.handleViewerDimensionsChange
    );
  }

  /**
   * @ignore
   */
  @Watch('position')
  protected handlePositionChanged(
    newPosition?: Vector3.Vector3,
    oldPosition?: Vector3.Vector3
  ): void {
    this.transform = this.createTransform();

    console.debug(
      `Updating indicator position [previous=${JSON.stringify(
        oldPosition
      )}, current=${JSON.stringify(newPosition)}]`
    );
    this.indicator?.updateTransform(this.transform);
  }

  @Watch('normal')
  protected handleNormalChanged(
    newNormal?: Vector3.Vector3,
    oldNormal?: Vector3.Vector3
  ): void {
    console.debug(
      `Updating indicator normal [previous=${JSON.stringify(
        oldNormal
      )}, current=${JSON.stringify(newNormal)}]`
    );

    if (this.normal != null) {
      this.indicator?.updateNormal(this.normal);
    }
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <canvas
          ref={(el) => {
            this.canvasRef = el;
          }}
          class="indicator"
          width={this.viewer?.viewport.width}
          height={this.viewer?.viewport.height}
        />
      </Host>
    );
  }

  private handleViewerFrameDrawn = (): void => {
    this.updatePropsFromViewer();
  };

  private handleViewerDimensionsChange = (): void => {
    writeDOM(() => {
      if (this.viewer != null && this.canvasRef != null) {
        this.canvasRef.width = this.viewer.viewport.width;
        this.canvasRef.height = this.viewer.viewport.height;

        this.updateCanvasBounds(this.canvasRef);
      }
    });
  };

  private handleResize = (): void => {
    if (this.canvasRef != null) {
      this.updateCanvasBounds(this.canvasRef);
    }
  };

  private updatePropsFromViewer = (): void => {
    const { frame } = this.viewer || {};

    if (frame != null) {
      const widget = this.getIndicator();

      widget.updateFrame(frame);
    }
  };

  private setupIndicator = (canvasRef: HTMLCanvasElement): HitIndicator => {
    console.debug(
      `Initializing hit indicator. [initial-position=${JSON.stringify(
        this.position
      )}, has-initial-frame=${this.viewer?.frame != null}]`
    );

    this.indicator = new HitIndicator(canvasRef, {
      arrow: this.arrowColor,
      plane: this.planeColor,
    });

    if (this.position != null) {
      this.transform = this.createTransform();
      this.indicator.updateTransform(this.transform);
    }
    if (this.viewer?.frame != null) {
      this.indicator.updateFrame(this.viewer.frame, true);
    }

    return this.indicator;
  };

  private updateCanvasBounds = (canvasElement: HTMLCanvasElement): void => {
    readDOM(() => {
      this.canvasBounds = canvasElement.getBoundingClientRect();

      this.getIndicator().updateDimensions(canvasElement);
    });
  };

  private createTransform = (): Matrix4.Matrix4 | undefined => {
    if (this.position != null) {
      return Matrix4.makeTranslation(this.position);
    }
  };

  private getIndicator = (): HitIndicator => {
    if (this.indicator == null && this.canvasRef != null) {
      return this.setupIndicator(this.canvasRef);
    } else if (this.indicator != null) {
      return this.indicator;
    } else {
      throw new Error(
        'Hit indicator was not initialized. The canvas element may not have been initialized.'
      );
    }
  };
}
