import { DepthBuffer, Viewport } from '../../lib/types';

export function computeServerDepthTextureMatrix(
  depthBuffer: DepthBuffer,
  viewport: Viewport
): number[] {
  const scale = viewport.calculateFrameScale(depthBuffer);
  const scaleX = 1 / (depthBuffer.imageScale * scale.x);
  const scaleY = 1 / (depthBuffer.imageScale * scale.y);

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

  // console.log('draw rect', drawRect, depthBuffer.imageDimensions);

  return res;
}

export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const utils = `
  struct Rect {
    float x;
    float y;
    float width;
    float height;
  };

  bool containsPoint(vec2 pt, Rect rect) {
    return pt.x >= rect.x && pt.x <= rect.x + rect.width && pt.y >= rect.y && pt.y <= rect.y + rect.height;
  }

  float lerp(float a, float b, float t) {
    return a + (b - a) * t;
  }
`;

export const blendedFragmentShader = `
  #include <packing>

  ${utils}

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

  float getWorldDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
    return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
  }

  float getNormalizedServerDepth(sampler2D serverDepth, vec2 coord) {
    vec3 scaledPos = vec3(coord.x - serverDepthRect.x, coord.y - serverDepthRect.y, 1.0) * serverDepthMatrix;
    ivec2 pos = ivec2(scaledPos.x, scaledPos.y);

    if (containsPoint(coord, serverDepthRect)) {
      vec4 values = texelFetch(serverDepth, pos, 0);
      // Need to investigate if we need to use the same projected math from DepthBuffer here.
      return values.r;
    } else {
      return 1.0;
    }
  }

  float getServerDepthInWorld(sampler2D serverDepth, vec2 coord) {
    float depth = getNormalizedServerDepth(serverDepth, coord);
    float localDepth = lerp(serverNear, serverFar, depth);
    return (localDepth - cameraNear) / (cameraFar - cameraNear);
  }

  void main() {
    float worldDepth = getWorldDepth(depthTexture, vUv);
    float serverDepth = getServerDepthInWorld(serverDepthTexture, gl_FragCoord.xy);
    vec4 color = texture2D(diffuseTexture, vUv);
    float alpha = worldDepth < serverDepth ? color.a : 0.0;

    gl_FragColor.rgb = color.rgb;
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
