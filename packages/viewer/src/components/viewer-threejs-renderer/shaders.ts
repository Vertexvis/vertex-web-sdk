import { DepthBuffer, Viewport } from '../../lib/types';

export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  #include <packing>

  struct Rect {
    float x;
    float y;
    float width;
    float height;
  };

  varying vec2 vUv;
  uniform sampler2D diffuseTexture;
  uniform sampler2D depthTexture;
  uniform sampler2D serverDepthTexture;
  uniform Rect serverDepthRect;
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
    float serverNormDepth = coord.x >= serverDepthRect.x && coord.y >= serverDepthRect.y && coord.x <= serverDepthRect.width && coord.y <= serverDepthRect.height ? texture(serverDepth, coord).r : 1.0;
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
  }
`;

export const drawObjectShader = `
  #include <packing>

  varying vec2 vUv;
  uniform sampler2D diffuseTexture;
  uniform sampler2D depthTexture;
  uniform sampler2D serverDepthTexture;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform float serverNear;
  uniform float serverFar;

  void main() {
    vec4 color = texture2D(diffuseTexture, vUv);

    gl_FragColor = color;
    gl_FragColor.a = 1.0;
  }
`;

export const drawServerDepthShader = `
  #include <packing>

  varying vec2 vUv;
  uniform sampler2D diffuseTexture;
  uniform sampler2D depthTexture;
  uniform sampler2D serverDepthTexture;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform float serverNear;
  uniform float serverFar;

  void main() {
    vec4 color = texture2D(serverDepthTexture, vUv);

    gl_FragColor = color;
    gl_FragColor.a = 1.0;
  }
`;

export function computeServerDepthTextureMatrix(
  depthBuffer: DepthBuffer,
  viewport: Viewport
): number[] {
  const drawRect = viewport.calculateDrawRect(
    depthBuffer,
    depthBuffer.imageDimensions
  );
  const scale = viewport.calculateFrameScale(depthBuffer);
  const scaleX = viewport.width / drawRect.width;
  const scaleY = viewport.height / drawRect.height;

  // const tx = -drawRect.x / viewport.width - 0.5;
  // const ty = -drawRect.y / viewport.height - 0.5;

  const tx = 0;
  const ty = 0;

  /* eslint-disable prettier/prettier */
  const res = [
    scaleX, 0,      tx,
    0,      scaleY, ty,
    0,      0,      1
  ];
  /* eslint-enable prettier/prettier */

  console.log('m', res, drawRect, depthBuffer.rect);
  return res;
}

export const debugServerDepth16Shader = `
  #include <packing>

  struct Rect {
    float x;
    float y;
    float width;
    float height;
  };

  varying vec2 vUv;
  uniform sampler2D diffuseTexture;
  uniform sampler2D depthTexture;
  uniform sampler2D serverDepthTexture;
  uniform mat3 serverDepthMatrix;
  uniform Rect serverDepthRect;
  uniform vec2 dimensions;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform float serverNear;
  uniform float serverFar;

  float readServerDepth(sampler2D serverDepth, vec2 coord) {
    float x = coord.x * dimensions.x;
    float y = coord.y * dimensions.y;
    float left = serverDepthRect.x;
    float top = serverDepthRect.y;
    float right = serverDepthRect.x + serverDepthRect.width;
    float bottom = serverDepthRect.y + serverDepthRect.height;

    return texture(serverDepth, coord).r;

    // if (x >= left && y >= top && x <= right && y <= bottom) {
    //   return texture(serverDepth, coord).r;
    // } else {
    //   return 1.0;
    // }
  }

  void main() {
    float serverDepth = readServerDepth(serverDepthTexture, vUv);

    mat3 m;
    m[0] = vec3(2.0, 0.0, -0.5);
    m[1] = vec3(0.0, 2.0, -0.5);
    m[2] = vec3(0.0, 0.0, 1.0);

    float scale = 1.0;
    // vec2 coords = (vUv - 0.5) * scale + (0.5 * scale);
    vec3 coord = (vec3(vUv.x, vUv.y, 1.0) - 0.5) * serverDepthMatrix + (0.5 * scale);
    // vec3 coords = vec3(vUv.x, vUv.y, 1.0) * serverDepthMatrix;
    gl_FragColor.rgb = vec3(texture2D(serverDepthTexture, coord.xy).r);
    gl_FragColor.a = 1.0;
  }
`;

export const debugServerDepthShader = `
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
  }
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const debugObjectsShader = `
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
export const debugDepthsShader = `
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
