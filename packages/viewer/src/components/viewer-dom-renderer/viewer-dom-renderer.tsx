import {
  Component,
  Element,
  h,
  Host,
  Listen,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { update3d, Renderer3d } from './renderer3d';
import { Renderer2d, update2d } from './renderer2d';
import { DepthBuffer, Viewport } from '../../lib/types';
import { FramePerspectiveCamera } from '../../lib/types/frame';
import { Matrix4 } from '@vertexvis/geometry';

export type ViewerDomRendererDrawMode = '2d' | '3d';

/**
 * The `ViewerDomRenderer` is responsible for managing a
 * `<vertex-viewer-dom-renderer>` element. This element supports drawing DOM
 * objects in a local 3D scene that is synced with a remote rendered scene.
 */
@Component({
  tag: 'vertex-viewer-dom-renderer',
  styleUrl: 'viewer-dom-renderer.css',
  shadow: true,
})
export class ViewerDomRenderer {
  /**
   * Specifies the drawing mode for the renderer.
   *
   * When in `3d` mode, elements are positioned using CSS 3D transforms and will
   * scale and rotate with the camera. In `2d` mode, a simpler 2D transform is
   * used, and elements will not scale or rotate with camera changes.
   */
  @Prop()
  public drawMode: ViewerDomRendererDrawMode = '3d';

  /**
   * The viewer synced to this renderer. This property will automatically be
   * assigned if the renderer is a child of `<vertex-viewer>`.
   */
  @Prop()
  public viewer?: HTMLVertexViewerElement;

  /**
   * The current camera of the frame.
   *
   * This property will automatically be set when supplying a viewer to the
   * component, or when added as a child to `<vertex-viewer>`.
   */
  // @Prop({ mutable: true })
  // public camera?: FramePerspectiveCamera;

  @Prop({ mutable: true })
  public viewMatrix?: Matrix4.Matrix4;

  @Prop({ mutable: true })
  public projectionMatrix?: Matrix4.Matrix4;

  /**
   * The current depth buffer of the frame.
   *
   * This property will automatically be set when supplying a viewer to the
   * component, or when added as a child to `<vertex-viewer>`.
   */
  @Prop({ mutable: true })
  public depthBuffer?: DepthBuffer;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private invalidateFrameCounter = 0;

  @Element()
  private hostEl!: HTMLElement;

  /**
   * @ignore
   */
  protected componentWillLoad(): void {
    const resized = new ResizeObserver(() => this.handleResize());
    resized.observe(this.hostEl);

    const mutation = new MutationObserver(() => this.handleChildrenChange());
    mutation.observe(this.hostEl, { childList: true });
  }

  /**
   * @ignore
   */
  public render(): h.JSX.IntrinsicElements {
    if (this.viewMatrix != null && this.projectionMatrix != null) {
      if (this.drawMode === '2d') {
        return (
          <Host>
            <Renderer2d>
              <slot></slot>
            </Renderer2d>
          </Host>
        );
      } else {
        return (
          <Host>
            <Renderer3d
              projectionMatrix={this.projectionMatrix}
              viewMatrix={this.viewMatrix}
              viewport={this.viewport}
            >
              <slot></slot>
            </Renderer3d>
          </Host>
        );
      }
    } else {
      return <Host></Host>;
    }
  }

  /**
   * @ignore
   */
  protected componentDidRender(): void {
    this.updateElements();
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
  @Listen('propertyChange')
  protected handlePropertyChange(): void {
    this.invalidateFrame();
  }

  private invalidateFrame(): void {
    this.invalidateFrameCounter = this.invalidateFrameCounter + 1;
  }

  private async updateElements(): Promise<void> {
    const { viewport, viewMatrix, projectionMatrix } = this;

    if (viewMatrix != null && projectionMatrix != null) {
      if (this.drawMode === '3d') {
        update3d(this.hostEl, viewport, viewMatrix, this.depthBuffer);
      } else {
        update2d(
          this.hostEl,
          viewport,
          projectionMatrix,
          viewMatrix,
          this.depthBuffer
        );
      }
    }
  }

  private handleViewerFrameDrawn = async (): Promise<void> => {
    this.updatePropsFromViewer();
  };

  private handleResize(): void {
    const bounds = this.hostEl.getBoundingClientRect();
    this.viewport = new Viewport(bounds.width, bounds.height);
  }

  private handleChildrenChange(): void {
    this.invalidateFrame();
  }

  private async updatePropsFromViewer(): Promise<void> {
    const { frame, streamAttributes } = this.viewer || {};

    this.depthBuffer =
      streamAttributes?.depthBuffers?.enabled &&
      streamAttributes.depthBuffers.frameType === 'all'
        ? await frame?.depthBuffer()
        : undefined;
    // this.camera = frame?.scene?.camera;
    this.projectionMatrix = frame?.scene.camera.projectionMatrix;
    this.viewMatrix = frame?.scene.camera.viewMatrix;
  }
}
