import { Component, Element, h, Host, Prop, State, Watch } from '@stencil/core';
import {
  BoxGeometry,
  DepthFormat,
  DepthTexture,
  Mesh,
  MeshNormalMaterial,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedIntType,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { vertexShader, fragmentShader } from './shaders';

@Component({
  tag: 'vertex-viewer-threejs-renderer',
  styleUrl: 'viewer-threejs-renderer.css',
  shadow: true,
})
export class ViewerThreeJsRenderer {
  @Prop()
  public scene: Scene = new Scene();

  @Prop()
  public viewer?: HTMLVertexViewerElement;

  @State()
  private camera: PerspectiveCamera = new PerspectiveCamera();

  @State()
  private postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  @State()
  private postMaterial = new ShaderMaterial({ vertexShader, fragmentShader });

  @State()
  private target: WebGLRenderTarget;

  @Element()
  private hostEl!: HTMLElement;

  private renderer?: WebGLRenderer;

  public constructor() {
    this.target = new WebGLRenderTarget(1, 1);
    this.target.texture.format = RGBAFormat;
    this.target.texture.minFilter = NearestFilter;
    this.target.texture.magFilter = NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.depthBuffer = true;
    this.target.depthTexture = new DepthTexture(1, 1);
    this.target.depthTexture.format = DepthFormat;
    this.target.depthTexture.type = UnsignedIntType;
  }

  protected componentWillLoad(): void {
    this.target.texture.format = RGBAFormat;
  }

  protected componentDidLoad(): void {
    const canvas = this.hostEl.shadowRoot?.getElementById(
      'canvas'
    ) as HTMLCanvasElement;

    const geometry = new BoxGeometry(10, 10, 10);
    const material = new MeshNormalMaterial();
    const cube = new Mesh(geometry, material);
    this.scene.add(cube);

    const renderer = new WebGLRenderer({ canvas, alpha: true });
    renderer.setAnimationLoop(() => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(this.scene, this.camera);
    });
    this.renderer = renderer;

    const resize = new ResizeObserver(() => this.updateSize());
    resize.observe(this.hostEl);

    this.updateSize();
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

  private handleFrameDrawn = (): void => {
    const camera = this.viewer?.frame?.scene.camera;
    if (camera != null) {
      const { position, lookAt, up, fovY, aspectRatio, near, far } = camera;
      this.camera.position.set(position.x, position.y, position.z);
      this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
      this.camera.up.set(up.x, up.y, up.z);

      this.camera.fov = fovY;
      this.camera.aspect = aspectRatio;
      this.camera.near = near;
      this.camera.far = far;
      this.camera.updateProjectionMatrix();

      this.postMaterial.uniforms = {
        diffuseTexture: { value: this.target.texture },
        depthTexture: { value: this.target.depthTexture },
        serverDepthTexture: {
          value: createInitialServerDepthTexture(w, h),
        },
        cameraNear: { value: near },
        cameraFar: { value: far },
        serverNear: { value: 0 },
        serverFar: { value: 1 },
      },
    }
  };

  private updateSize(): void {
    const { width, height } = this.hostEl.getBoundingClientRect();
    this.renderer?.setSize(width, height);
    this.target.setSize(width, height);

  }
}
