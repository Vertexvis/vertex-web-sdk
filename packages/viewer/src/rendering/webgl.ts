import * as THREE from 'three';
import { FrameCamera } from '../types';
import { loadImageBytes } from './imageLoaders';

interface WebGlScene {
  render(
    camera: FrameCamera.FrameCamera,
    near: number,
    far: number,
    depthTexture: Uint8Array | undefined,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ): void;
}

function drawSimulatedDepthBuffer(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, centerX, centerY);
    ctx.fillRect(centerX, centerY, centerX, centerY);

    ctx.fillStyle = '#7f7f7f';
    ctx.fillRect(0, centerY, centerX, centerY);
    ctx.fillRect(centerX, 0, centerX, centerY);

    // ctx.fillStyle = '#ff0000';
    // ctx.fillRect(0, 0, width, height);
  }
}

function createSimulatedServerDepthTexture(
  w: number,
  h: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const serverDepthTexture = new THREE.CanvasTexture(canvas);
  serverDepthTexture.format = THREE.RGBFormat;
  serverDepthTexture.minFilter = THREE.NearestFilter;
  serverDepthTexture.magFilter = THREE.NearestFilter;
  drawSimulatedDepthBuffer(canvas, w, h);
  return serverDepthTexture;
}

function createServerDepthTexture(
  w: number,
  h: number,
  offsetX: number,
  offsetY: number,
  bitmap: ImageBitmap | HTMLImageElement
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const serverDepthTexture = new THREE.CanvasTexture(canvas);
  serverDepthTexture.format = THREE.RGBFormat;
  serverDepthTexture.minFilter = THREE.NearestFilter;
  serverDepthTexture.magFilter = THREE.NearestFilter;

  const context = canvas.getContext('2d');

  if (context != null) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, w, h);
    context.drawImage(bitmap, offsetX, offsetY);
  }

  return serverDepthTexture;
}

function createCube(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshNormalMaterial({ opacity: random(1, 1) });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function createWebGlScene(
  canvas: HTMLCanvasElement,
  w: number,
  h: number
): WebGlScene {
  let width = w;
  let height = h;
  let frameCamera: FrameCamera.FrameCamera = {
    position: { x: 0, y: 0, z: 1 },
    lookAt: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
  };
  let lastNear = 0;
  let lastFar = 1;
  let lastDepthImage: Uint8Array | undefined;
  let lastOffsetX = 0;
  let lastOffsetY = 0;

  const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 10000);
  camera.position.z = 1;

  const scene = new THREE.Scene();

  const cubes = Array.from({ length: 50 }).map(_ => {
    const cube = createCube();
    cube.position.x = random(-400, 400);
    cube.position.y = random(-400, 400);
    cube.position.z = random(-400, 400);
    scene.add(cube);
    return cube;
  });

  const target = new THREE.WebGLRenderTarget(width, height);
  target.texture.format = THREE.RGBAFormat;
  target.texture.minFilter = THREE.NearestFilter;
  target.texture.magFilter = THREE.NearestFilter;
  target.texture.generateMipmaps = false;
  target.depthBuffer = true;
  target.depthTexture = new THREE.DepthTexture(width, height);
  target.depthTexture.format = THREE.DepthFormat;
  target.depthTexture.type = THREE.UnsignedShortType;

  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMaterial = new THREE.ShaderMaterial({
    vertexShader: document.querySelector('#post-vert')?.textContent?.trim(),
    fragmentShader: document.querySelector('#post-frag')?.textContent?.trim(),
    uniforms: {
      diffuseTexture: { value: target.texture },
      depthTexture: { value: target.depthTexture },
      serverDepthTexture: {
        value: createSimulatedServerDepthTexture(w, h),
      },
      cameraNear: { value: camera.near },
      cameraFar: { value: camera.far },
    },
  });
  const postPlane = new THREE.PlaneGeometry(2, 2);
  const postQuad = new THREE.Mesh(postPlane, postMaterial);
  const postScene = new THREE.Scene();
  postScene.add(postQuad);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    alpha: true,
  });
  renderer.setSize(width, height);

  async function render(
    updatedCamera: FrameCamera.FrameCamera,
    near: number,
    far: number,
    depthImage: Uint8Array | undefined,
    offsetX: number,
    offsetY: number,
    w: number,
    h: number
  ): Promise<void> {
    if (width !== w || height !== h) {
      width = w;
      height = h;

      camera.aspect = width / height;

      target.width = width;
      target.height = height;
      target.depthTexture = new THREE.DepthTexture(width, height);
      target.depthTexture.format = THREE.DepthFormat;
      target.depthTexture.type = THREE.UnsignedShortType;
      renderer.setSize(width, height);
    }

    if (depthImage != null) {
      const image = await loadImageBytes(depthImage);
      const texture = createServerDepthTexture(
        w,
        h,
        offsetX,
        offsetY,
        image.image
      );
      postMaterial.uniforms.serverDepthTexture = {
        value: texture,
      };
    }

    lastOffsetX = offsetX;
    lastOffsetY = offsetY;
    lastNear = near;
    lastFar = far;
    lastDepthImage = depthImage;
    frameCamera = updatedCamera;

    const { position, lookAt, up } = frameCamera;
    camera.position.x = position.x;
    camera.position.y = position.y;
    camera.position.z = position.z;

    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    camera.up.x = up.x;
    camera.up.y = up.y;
    camera.up.z = up.z;

    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();

    renderer.setRenderTarget(target);
    renderer.render(scene, camera);

    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
  }

  renderer.setAnimationLoop(time => {
    cubes.forEach(cube => {
      cube.rotation.x = time / 2000;
      cube.rotation.y = time / 1000;
    });

    render(
      frameCamera,
      lastNear,
      lastFar,
      lastDepthImage,
      lastOffsetX,
      lastOffsetY,
      width,
      height
    );
  });

  render(
    frameCamera,
    lastNear,
    lastFar,
    lastDepthImage,
    lastOffsetX,
    lastOffsetY,
    width,
    height
  );

  return { render };
}
