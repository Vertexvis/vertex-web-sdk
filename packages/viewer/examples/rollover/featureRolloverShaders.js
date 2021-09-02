const featureEntity = `
    vec4 featureEntity(sampler2D featureEntityMap, vec2 mouseNormalized, vec2 uv, vec4 currentColor,vec4 featureHightlightColor)
    {
        vec4 feature = texture(featureEntityMap, mouseNormalized);
        if (feature == currentColor && feature.a > 0.0){
          // return the hightlight color
          return vec4(featureHightlightColor.xyz,1);
        } else {
          // Output to screen
          return vec4(0,0,0,0);
        }
      }
`;

export const quadVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}`;

export const glassPaneFragmentShader = `

  ${featureEntity}

  varying vec2 vUv;
  uniform sampler2D featureMap;
  uniform sampler2D diffuseMap;
  uniform vec2 u_mouse;
  uniform vec4 u_featureHighlightColor;
  uniform bool u_highlightFeature;
  void main()
{
    if(u_highlightFeature){
       vec4 currentFeatureColor = texture(featureMap,vUv);
       vec4 currentFragmentColor = texture(diffuseMap,vUv);
       vec4 featureHighlightColor = mix(currentFragmentColor,u_featureHighlightColor,.5);
       // Output to screen
       gl_FragColor = featureEntity(featureMap, u_mouse.xy,vUv,currentFeatureColor, featureHighlightColor);
    }else{
        gl_FragColor = vec4(0,0,0,0);
    }
}
`;
