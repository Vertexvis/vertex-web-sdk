import { Rectangle } from '@vertexvis/geometry';
import * as THREE from 'three';
import { FrameCamera } from '../types';

interface WebGlScene {
  render(
    camera: FrameCamera.FrameCamera,
    near: number,
    far: number,
    depthTexture: HTMLImageElement | ImageBitmap | undefined,
    imageRect: Rectangle.Rectangle,
    width: number,
    height: number
  ): void;
}

function createInitialServerDepthTexture(
  w: number,
  h: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  return new THREE.CanvasTexture(canvas);
}

function createServerDepthTexture(
  w: number,
  h: number,
  imageRect: Rectangle.Rectangle,
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
    context.drawImage(
      bitmap,
      imageRect.x,
      imageRect.y,
      imageRect.width,
      imageRect.height
    );
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
  let lastFar = 2000;
  let lastDepthImage: HTMLImageElement | ImageBitmap | undefined;
  let lastImageRect = { x: 0, y: 0, width: 1, height: 1 };

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2500);
  camera.position.z = 1;

  const scene = new THREE.Scene();

  const cubes = Array.from({ length: 75 }).map(_ => {
    const cube = createCube();
    cube.position.x = random(-400, 400);
    cube.position.y = random(-400, 400);
    cube.position.z = random(-400, 400);
    scene.add(cube);
    return cube;
  });

  const cube = createCube();
  cube.position.x = 0;
  cube.position.y = 0;
  cube.position.z = -100;
  scene.add(cube);

  const target = new THREE.WebGLRenderTarget(width, height);
  target.texture.format = THREE.RGBAFormat;
  target.texture.minFilter = THREE.NearestFilter;
  target.texture.magFilter = THREE.NearestFilter;
  target.texture.generateMipmaps = false;
  target.depthBuffer = true;
  target.depthTexture = new THREE.DepthTexture(width, height);
  target.depthTexture.format = THREE.DepthFormat;
  target.depthTexture.type = THREE.UnsignedIntType;

  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: actualShader,
    uniforms: {
      diffuseTexture: { value: target.texture },
      depthTexture: { value: target.depthTexture },
      serverDepthTexture: {
        value: createInitialServerDepthTexture(w, h),
      },
      cameraNear: { value: camera.near },
      cameraFar: { value: camera.far },
      serverNear: { value: 0 },
      serverFar: { value: 1 },
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
    depthImage: HTMLImageElement | ImageBitmap | undefined,
    imageRect: Rectangle.Rectangle,
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
      const texture = createServerDepthTexture(w, h, imageRect, depthImage);
      postMaterial.uniforms.serverDepthTexture = {
        value: texture,
      };
    }

    postMaterial.uniforms.cameraNear = { value: camera.near };
    postMaterial.uniforms.cameraFar = { value: camera.far };
    postMaterial.uniforms.serverNear = { value: near };
    postMaterial.uniforms.serverFar = { value: far };

    lastImageRect = imageRect;
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
      lastImageRect,
      width,
      height
    );
  });

  render(
    frameCamera,
    lastNear,
    lastFar,
    lastDepthImage,
    lastImageRect,
    width,
    height
  );

  return { render };
}

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const actualShader = `
#include <packing>

varying vec2 vUv;
uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform sampler2D serverDepthTexture;
uniform float cameraNear;
uniform float cameraFar;
uniform float serverNear;
uniform float serverFar;

float readDepth(sampler2D depthSampler, vec2 coord) {
  float fragCoordZ = texture2D(depthSampler, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
  return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

float readServerDepth(sampler2D serverDepth, vec2 coord) {
  float serverNormDepth = texture(serverDepth, coord).r;
  if (serverNormDepth != 1.0) {
    float localCoordDepth = serverNear + (serverFar - serverNear) * serverNormDepth;
    float localNormDepth = localCoordDepth / (cameraFar - cameraNear);
    return localNormDepth;
  } else {
    return serverNormDepth;
  }
}

void main() {
  float depth = readDepth(depthTexture, vUv);
  float serverDepth = readServerDepth(serverDepthTexture, vUv);
  vec4 color = texture2D(diffuseTexture, vUv);
  float alpha = depth < serverDepth ? color.a : 0.0;

  gl_FragColor = color;
  gl_FragColor.a = alpha;
}`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debugServerDepthShader = `
#include <packing>

varying vec2 vUv;
uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform sampler2D serverDepthTexture;
uniform float cameraNear;
uniform float cameraFar;
uniform float serverNear;
uniform float serverFar;

float readDepth(sampler2D depthSampler, vec2 coord) {
  float fragCoordZ = texture2D(depthSampler, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
  return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

float readServerDepth(sampler2D serverDepth, vec2 coord) {
  float serverNormDepth = texture(serverDepth, coord).r;
  if (serverNormDepth != 1.0) {
    float localCoordDepth = serverNear + (serverFar - serverNear) * serverNormDepth;
    float localNormDepth = localCoordDepth / (cameraFar - cameraNear);
    return localNormDepth;
  } else {
    return serverNormDepth;
  }
}

void main() {
  float depth = readDepth(depthTexture, vUv);
  float serverDepth = readServerDepth(serverDepthTexture, vUv);
  vec4 color = texture2D(diffuseTexture, vUv);
  float alpha = depth < serverDepth ? color.a : 0.0;

  gl_FragColor.rgb = vec3(serverDepth);
  gl_FragColor.a = 1.0;
}`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debugObjectsShader = `
#include <packing>

varying vec2 vUv;
uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform sampler2D serverDepthTexture;
uniform float cameraNear;
uniform float cameraFar;

float readDepth(sampler2D depthSampler, vec2 coord) {
  float fragCoordZ = texture2D(depthSampler, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
  return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

void main() {
  float depth = readDepth(depthTexture, vUv);
  float serverDepth = texture(serverDepthTexture, vUv).r;
  vec4 color = texture2D(diffuseTexture, vUv);
  float alpha = depth < serverDepth ? color.a : 0.0;

  gl_FragColor = color;
}
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debugDepthsShader = `
#include <packing>

varying vec2 vUv;
uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform sampler2D serverDepthTexture;
uniform float cameraNear;
uniform float cameraFar;

float readDepth(sampler2D depthSampler, vec2 coord) {
  float fragCoordZ = texture2D(depthSampler, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
  return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

void main() {
  float depth = readDepth(depthTexture, vUv);
  float serverDepth = texture(serverDepthTexture, vUv).r;
  vec4 color = texture2D(diffuseTexture, vUv);
  float alpha = depth < serverDepth ? color.a : 0.0;

  gl_FragColor.rgb = vec3(depth);
  gl_FragColor.a = 1.0;
}
`;
