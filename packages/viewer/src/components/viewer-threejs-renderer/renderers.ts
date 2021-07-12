import {
  CanvasTexture,
  DataTexture,
  DepthFormat,
  DepthTexture,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  UnsignedIntType,
  UnsignedShortType,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { Matrix4 } from '@vertexvis/geometry';
import { DepthBuffer, Frame, Viewport } from '../../lib/types';
import {
  vertexShader,
  blendedFragmentShader,
  computeServerDepthTextureMatrix,
} from './shaders';

export interface Renderer {
  render(
    scene: Scene,
    camera: PerspectiveCamera,
    frame: Frame,
    viewport: Viewport
  ): Promise<void>;

  dispose(): void;
}

export class OverlayRenderer implements Renderer {
  private renderer: WebGLRenderer;

  private width = 0;
  private height = 0;

  public constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true });
    console.log('WebGL capabilities', this.renderer.capabilities);
  }

  public dispose(): void {
    this.renderer.dispose();
  }

  public async render(
    scene: Scene,
    camera: PerspectiveCamera,
    frame: Frame,
    viewport: Viewport
  ): Promise<void> {
    const { width, height } = viewport;

    if (this.width !== width && this.height !== height) {
      this.renderer.setSize(width, height);

      this.width = width;
      this.height = height;
    }

    this.renderer.render(scene, camera);
  }
}

export class BlendedRenderer implements Renderer {
  private renderer: WebGLRenderer;
  private target: WebGLRenderTarget;
  private postMaterial: ShaderMaterial;
  private postPlane: PlaneGeometry;
  private postQuad: Mesh;
  private postScene: Scene;
  private postCamera: OrthographicCamera;

  private width = 0;
  private height = 0;

  public constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true });
    console.log('WebGL capabilities', this.renderer.capabilities);

    this.target = new WebGLRenderTarget(1, 1);
    this.target.texture.format = RGBAFormat;
    this.target.texture.minFilter = NearestFilter;
    this.target.texture.magFilter = NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.depthBuffer = true;
    this.target.depthTexture = new DepthTexture(1, 1);
    this.target.depthTexture.format = DepthFormat;
    this.target.depthTexture.type = UnsignedIntType;

    this.postMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader: blendedFragmentShader,
      uniforms: {
        diffuseTexture: { value: this.target.texture },
        depthTexture: { value: this.target.depthTexture },
        serverDepthTexture: { value: createInitialDepthTexture(1, 1) },
        serverDepthRect: { value: { x: 0, y: 0, width: 1, height: 1 } },
        serverDepthMatrix: { value: Matrix4.makeIdentity() },
        dimensions: { value: [1, 1] },
        cameraNear: { value: 0.01 },
        cameraFar: { value: 1 },
        serverNear: { value: 0 },
        serverFar: { value: 1 },
      },
    });
    this.postPlane = new PlaneGeometry(2, 2);
    this.postQuad = new Mesh(this.postPlane, this.postMaterial);
    this.postScene = new Scene();
    this.postScene.add(this.postQuad);
    this.postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  public dispose(): void {
    this.renderer.dispose();
    this.target.dispose();
    this.postMaterial.dispose();
    this.postPlane.dispose();
  }

  public async render(
    scene: Scene,
    camera: PerspectiveCamera,
    frame: Frame,
    viewport: Viewport
  ): Promise<void> {
    await this.updateUniforms(camera, frame, viewport);

    if (this.width !== viewport.width && this.height !== viewport.height) {
      const { width, height } = viewport;
      this.target.depthTexture.dispose();

      this.target.setSize(width, height);
      this.target.depthTexture = new DepthTexture(width, height);
      this.target.depthTexture.format = DepthFormat;
      this.target.depthTexture.type = UnsignedIntType;

      this.renderer.setSize(width, height);

      this.width = width;
      this.height = height;
    }

    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);
  }

  private async updateUniforms(
    camera: PerspectiveCamera,
    frame: Frame,
    viewport: Viewport
  ): Promise<void> {
    const { uniforms } = this.postMaterial;
    uniforms.cameraNear = { value: camera.near };
    uniforms.cameraFar = { value: camera.far };
    uniforms.serverNear = { value: frame.scene.camera.near };
    uniforms.serverFar = { value: frame.scene.camera.far };
    uniforms.depthTexture = { value: this.target.depthTexture };
    uniforms.dimensions = {
      value: [viewport.width, viewport.height],
    };

    const depthBuffer = await frame.depthBuffer();
    if (depthBuffer != null) {
      const { x, y, width, height } = viewport.calculateDrawRect(
        depthBuffer,
        depthBuffer.imageDimensions
      );
      uniforms.serverDepthTexture = {
        value: createDepthDataTexture(depthBuffer, viewport),
      };
      uniforms.serverDepthRect = {
        value: {
          x: x,
          // Position server depth from top of screen. WebGL renders from
          // bottom of screen. Consider moving to shader.
          y: viewport.height - (height + y),
          width: width,
          height: height,
        },
      };
      uniforms.serverDepthMatrix = {
        value: computeServerDepthTextureMatrix(depthBuffer, viewport),
      };
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
