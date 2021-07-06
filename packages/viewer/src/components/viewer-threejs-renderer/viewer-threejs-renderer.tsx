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
  AmbientLight,
  CanvasTexture,
  DataTexture,
  DepthFormat,
  DirectionalLight,
  NearestFilter,
  PerspectiveCamera,
  Scene,
  Texture,
  UnsignedShortType,
} from 'three';
import { DepthBuffer, Frame, Viewport } from '../../lib/types';
import { BlendedRenderer, OverlayRenderer, Renderer } from './renderers';

export type ViewerThreeJsRendererDrawMode = 'animation-frame' | 'manual';

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
  public drawMode: ViewerThreeJsRendererDrawMode = 'manual';

  @Prop()
  public willDraw?: () => void;

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @Prop()
  public occlude = false;

  @State()
  private viewport: Viewport = new Viewport(0, 0);

  @State()
  private frame?: Frame;

  @Element()
  private hostEl!: HTMLElement;

  private renderer?: Renderer;

  private animationFrameId?: number;

  @Method()
  public async draw(): Promise<void> {
    if (this.renderer != null) {
      this.willDraw?.();

      if (this.frame != null) {
        this.renderer.render(
          this.scene,
          this.camera,
          this.frame,
          this.viewport
        );
      }
    }
  }

  protected componentWillLoad(): void {
    // Lighting
    const color = 0xffffff;
    const intensity = 0.9;
    const light = new DirectionalLight(color, intensity);
    light.position.set(50, 50, 50);
    this.scene.add(light);

    this.scene.add(new AmbientLight(0x666666));
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
    oldViewer?.removeEventListener('frameDrawn', this.handleFrameDrawn);
    newViewer?.addEventListener('frameDrawn', this.handleFrameDrawn);
  }

  @Watch('drawMode')
  protected handleDrawModeChanged(): void {
    this.updateDrawMode();
  }

  private handleFrameDrawn = async (): Promise<void> => {
    const frame = this.viewer?.frame;
    if (frame != null) {
      const { camera } = frame.scene;
      const { position, lookAt, up, fovY, aspectRatio, near, far } = camera;

      const threeNear = Math.max(near - 1000, 0.1);
      const threeFar = far + 1000;

      this.camera.position.set(position.x, position.y, position.z);
      this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
      this.camera.up.set(up.x, up.y, up.z);

      this.camera.fov = fovY;
      this.camera.aspect = aspectRatio;
      this.camera.near = threeNear;
      this.camera.far = threeFar;
      this.camera.updateProjectionMatrix();
    }

    this.frame = frame;
  };

  private updateSize(): void {
    const { width, height } = this.hostEl.getBoundingClientRect();
    this.viewport = new Viewport(width, height);
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

function createInitialDepthTexture(w: number, h: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  return new CanvasTexture(canvas);
}

function createDepthDataTexture(
  depth: DepthBuffer,
  viewport: Viewport
): Texture {
  const { width, height } = depth.imageDimensions;

  const texture = new DataTexture(depth.data, width, height);
  texture.format = DepthFormat;
  texture.internalFormat = 'DEPTH_COMPONENT16';
  texture.type = UnsignedShortType;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.flipY = true;
  return texture;
}
