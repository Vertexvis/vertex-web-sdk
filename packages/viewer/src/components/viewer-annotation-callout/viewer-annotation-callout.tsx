import { Component, h, Host, Prop, Watch } from '@stencil/core';
import classNames from 'classnames';

import { CalloutAnnotationData } from '../../lib/annotations/annotation';
import { DepthBuffer } from '../../lib/types';
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

  /**
   * @internal
   * Whether the callout is occluded
   */
  @Prop({ mutable: true })
  public occluded = false;

  /**
   * The current depth buffer of the frame.
   *
   * This property will automatically be set when supplying a viewer to the
   * component, or when added as a child to `<vertex-viewer>`.
   */
  @Prop({ mutable: true })
  public depthBuffer?: DepthBuffer;

  /**
   * The viewer synced to this renderer.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * Dispatched when the callout's occlusion state is changed.
   */
  @Event()
  public occlusionStateChange!: EventEmitter<boolean>;

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    this.handleViewerChange(this.viewer, undefined);
  }

  /**
   * @ignore
   */
  @Watch('viewer')
  protected handleViewerChange(
    newViewer: HTMLVertexViewerElement | undefined,
    oldViewer: HTMLVertexViewerElement | undefined
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);
  }

  /**
   * @ignore
   */
  @Watch('depthBuffer')
  protected handleDepthBufferChange(): void {
    if (this.depthBuffer != null && this.data != null && this.viewer != null) {
      const previousOcclusionState = this.occluded;
      const isOccluded = this.depthBuffer.isOccluded(
        this.data.position,
        this.viewer.viewport
      );
      console.log('isOccluded: ' + isOccluded);
      this.occluded = isOccluded;

      if (isOccluded !== previousOcclusionState) {
        this.occlusionStateChange.emit(isOccluded);
      }
    }
  }

  public render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <div
          class={classNames('content', this.iconSize, {
            occluded: this.occluded,
          })}
          style={{
            borderColor: this.data.accentColor,
            backgroundColor: this.data.primaryColor,
          }}
        >
          <vertex-viewer-icon
            class="icon"
            name={this.data.icon}
            size={this.iconSize}
            style={{ color: this.data.accentColor }}
          ></vertex-viewer-icon>
        </div>
      </Host>
    );
  }

  private handleViewerFrameDrawn = async (): Promise<void> => {
    const { frame } = this.viewer || {};
    this.depthBuffer = await frame?.depthBuffer();
  };
}
