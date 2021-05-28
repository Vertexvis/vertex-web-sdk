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
import { makeLookAtViewMatrix } from '../../rendering/matrices';
import { update3d, Renderer3d } from './renderer3d';
import { Renderer2d, update2d } from './renderer2d';

export type ViewerDomRendererDrawMode = '2d' | '3d';

@Component({
  tag: 'vertex-viewer-dom-renderer',
  styleUrl: 'viewer-dom-renderer.css',
  shadow: true,
})
export class ViewerDomRenderer {
  @Prop()
  public drawMode: ViewerDomRendererDrawMode = '3d';

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @State()
  private dimensions = Dimensions.create(0, 0);

  @State()
  private projectionMatrix = Matrix4.makeIdentity();

  @State()
  private viewMatrix = Matrix4.makeIdentity();

  @State()
  private cameraMatrixWorld = Matrix4.makeIdentity();

  @State()
  private invalidateFrameCounter = 0;

  @Element()
  private hostEl!: HTMLElement;

  protected componentWillLoad(): void {
    const resized = new ResizeObserver(() => this.handleResize());
    resized.observe(this.hostEl);
  }

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

  protected componentDidRender(): void {
    this.updateElements();
  }

  @Watch('viewer')
  protected handleViewerChange(
    newViewer: HTMLVertexViewerElement | undefined,
    oldViewer: HTMLVertexViewerElement | undefined
  ): void {
    oldViewer?.removeEventListener('frameDrawn', this.handleViewerFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleViewerFrameDrawn);
  }

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
      this.viewMatrix = Matrix4.transpose(makeLookAtViewMatrix(camera));
      this.cameraMatrixWorld = Matrix4.invert(this.viewMatrix);
      this.projectionMatrix = Matrix4.makePerspective(
        camera.near,
        camera.far,
        camera.fovY,
        camera.aspectRatio
      );
    } else {
      this.viewMatrix = Matrix4.makeIdentity();
      this.projectionMatrix = Matrix4.makeIdentity();
    }
  };

  private handleResize(): void {
    const bounds = this.hostEl.getBoundingClientRect();
    this.dimensions = { width: bounds.width, height: bounds.height };
  }
}
