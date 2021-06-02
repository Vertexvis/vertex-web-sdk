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
import { Dimensions, Matrix4, Vector3 } from '@vertexvis/geometry';
import { update3d, Renderer3d } from './renderer3d';
import { Renderer2d, update2d } from './renderer2d';

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

  @State()
  private dimensions = Dimensions.create(0, 0);

  @State()
  private projectionMatrix = Matrix4.makeZero();

  @State()
  private viewMatrix = Matrix4.makeZero();

  @State()
  private cameraMatrixWorld = Matrix4.makeZero();

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
  }

  /**
   * @ignore
   */
  public render(): h.JSX.IntrinsicElements {
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
            dimensions={this.dimensions}
          >
            <slot></slot>
          </Renderer3d>
        </Host>
      );
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

  private updateElements(): void {
    if (this.drawMode === '3d') {
      update3d(this.hostEl, this.viewMatrix);
    } else {
      const halfDim = {
        width: this.dimensions.width / 2,
        height: this.dimensions.height / 2,
      };
      const cameraPosition = Vector3.fromMatrixPosition(this.cameraMatrixWorld);
      const viewProjectionMatrix = Matrix4.multiply(
        this.projectionMatrix,
        this.viewMatrix
      );

      update2d(this.hostEl, halfDim, cameraPosition, viewProjectionMatrix);
    }
  }

  private handleViewerFrameDrawn = async (): Promise<void> => {
    const scene = await this.viewer?.scene();
    const camera = scene?.camera();

    if (camera != null) {
      const { position, lookAt, up, near, far, fovY, aspectRatio } = camera;
      this.viewMatrix = Matrix4.makeLookAtView(position, lookAt, up);
      this.cameraMatrixWorld = Matrix4.invert(this.viewMatrix);
      this.projectionMatrix = Matrix4.makePerspective(
        near,
        far,
        fovY,
        aspectRatio
      );
    } else {
      this.viewMatrix = Matrix4.makeZero();
      this.projectionMatrix = Matrix4.makeZero();
    }
  };

  private handleResize(): void {
    const bounds = this.hostEl.getBoundingClientRect();
    this.dimensions = { width: bounds.width, height: bounds.height };
  }
}
