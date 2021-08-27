import {
  Component,
  Element,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import {
  PerspectiveCamera,
  Scene,
  Intersection,
  Raycaster,
  Vector2,
} from 'three';
import { Point } from '@vertexvis/geometry';
import { Frame, Viewport } from '../../lib/types';
import { BlendedRenderer, OverlayRenderer, Renderer } from './renderers';

export type ViewerThreeJsRendererDrawMode =
  | 'animation-frame'
  | 'manual'
  | 'synced';

@Component({
  tag: 'vertex-viewer-threejs-renderer',
  styleUrl: 'viewer-threejs-renderer.css',
  shadow: true,
})
export class ViewerThreeJsRenderer {
  @Prop()
  public scene: Scene = new Scene();

  @Prop()
  public camera: PerspectiveCamera = new PerspectiveCamera();

  @Prop()
  public drawMode: ViewerThreeJsRendererDrawMode = 'synced';

  @Prop()
  public willDraw?: () => void;

  @Prop()
  public clippingExtents = 1000;

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Prop()
  public occlude = false;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @Element()
  private hostEl!: HTMLElement;

  private renderer?: Renderer;

  private animationFrameId?: number;

  @Method()
  public async draw(): Promise<void> {
    if (this.viewer?.frame != null) {
      this.frameRenderer(this.viewer.frame);
    }
  }

  @Method()
  public async hit(point: Point.Point): Promise<Intersection[]> {
    const x = (point.x / this.viewport.width) * 2 - 1;
    const y = -(point.y / this.viewport.height) * 2 + 1;

    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(x, y), this.camera);

    return raycaster.intersectObjects(this.scene.children, true);
  }

  protected componentDidLoad(): void {
    const canvas = this.hostEl.shadowRoot?.getElementById(
      'canvas'
    ) as HTMLCanvasElement;

    if (this.occlude) {
      this.renderer = new BlendedRenderer(canvas);
    } else {
      this.renderer = new OverlayRenderer(canvas);
    }

    const resize = new ResizeObserver(() => this.updateSize());
    resize.observe(this.hostEl);

    this.updateSize();
    this.updateDrawMode();
    this.handleViewerChanged(this.viewer);
  }

  protected disconnectedCallback(): void {
    this.renderer?.dispose();
  }

  protected render(): h.JSX.IntrinsicElements {
    return (
      <Host>
        <canvas id="canvas" class="canvas"></canvas>
      </Host>
    );
  }

  @Watch('viewer')
  protected handleViewerChanged(
    newViewer?: HTMLVertexViewerElement,
    oldViewer?: HTMLVertexViewerElement
  ): void {
    oldViewer?.deregisterRenderer(this.frameRenderer);
    newViewer?.registerRenderer(this.frameRenderer);
  }

  @Watch('drawMode')
  protected handleDrawModeChanged(): void {
    this.updateDrawMode();
  }

  private frameRenderer = async (frame: Frame): Promise<void> => {
    if (this.renderer != null) {
      this.willDraw?.();

      const { camera } = frame.scene;
      const { position, lookAt, up, fovY, aspectRatio, near, far } = camera;

      const threeNear = Math.max(near - this.clippingExtents, 0.1);
      const threeFar = far + this.clippingExtents;

      this.camera.position.set(position.x, position.y, position.z);
      this.camera.up.set(up.x, up.y, up.z);
      this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

      this.camera.fov = fovY;
      this.camera.aspect = aspectRatio;
      this.camera.near = threeNear;
      this.camera.far = threeFar;
      this.camera.updateProjectionMatrix();

      this.renderer.render(this.scene, this.camera, frame, this.viewport);
    }
  };

  private updateSize(): void {
    const rect = this.hostEl.getBoundingClientRect();
    this.viewport = new Viewport(rect.width, rect.height);
  }

  private updateDrawMode(): void {
    if (this.drawMode !== 'animation-frame' && this.animationFrameId != null) {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    if (this.drawMode === 'animation-frame') {
      const frameLoop = (): void => {
        this.animationFrameId = window.requestAnimationFrame(() => {
          this.draw();
          frameLoop();
        });
      };
      frameLoop();
    }
  }
}