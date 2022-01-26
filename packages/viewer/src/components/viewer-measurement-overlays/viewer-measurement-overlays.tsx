/* eslint-disable @typescript-eslint/member-ordering */
import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { Disposable } from '@vertexvis/utils';

import {
  MeasurementOverlay,
  MeasurementOverlayManager,
} from '../../lib/measurement';
import { FramePerspectiveCamera } from '../../lib/types';
import { MeasurementOverlayView } from './viewer-measurement-overlays-components';

@Component({
  tag: 'vertex-viewer-measurement-overlays',
  styleUrl: 'viewer-measurement-overlays.css',
  shadow: true,
})
export class ViewerMeasurementOverlays {
  /**
   * The model that contains the overlays to present.
   */
  @Prop()
  public measurementOverlays = new MeasurementOverlayManager();

  private onOverlaysChangedListener?: Disposable;

  /**
   * @ignore
   */
  @Watch('measurementOverlays')
  protected handleMeasurementOverlaysChanged(): void {
    this.removeModelListeners();
    this.addModelListeners();

    this.updateOverlays();
  }

  /**
   * @internal
   */
  @Prop({ mutable: true })
  public camera?: FramePerspectiveCamera;

  /**
   * The viewer that this component is bound to.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    this.removeViewerListeners(oldViewer);
    this.addViewerListeners();

    this.updateCamera();
  }

  @State()
  private overlays: MeasurementOverlay[] = [];

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.addModelListeners();
    this.addViewerListeners();

    this.updateOverlays();
    this.updateCamera();
  }

  private addModelListeners(): void {
    this.onOverlaysChangedListener = this.measurementOverlays.onOverlaysChanged(
      () => this.updateOverlays()
    );
  }

  private removeModelListeners(): void {
    this.onOverlaysChangedListener?.dispose();
    this.onOverlaysChangedListener = undefined;
  }

  private addViewerListeners(): void {
    this.viewer?.addEventListener('frameReceived', this.updateCamera);
  }

  private removeViewerListeners(viewer?: HTMLVertexViewerElement): void {
    viewer?.removeEventListener('frameReceived', this.updateCamera);
  }

  private updateCamera = (): void => {
    this.camera = this.viewer?.frame?.scene.camera;
  };

  private updateOverlays(): void {
    this.overlays = this.measurementOverlays.getOverlays();
    console.log('update overlays', this.overlays);
  }

  /**
   * @ignore
   */
  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        {this.overlays.map((overlay) => {
          if (this.camera != null && this.viewer != null) {
            return (
              <MeasurementOverlayView
                overlay={overlay}
                viewport={this.viewer.viewport}
                camera={this.camera}
              />
            );
          }
        })}
      </Host>
    );
  }
}
