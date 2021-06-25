export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
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
  }
`;
