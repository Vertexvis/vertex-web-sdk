import regl from 'regl';
import reglLines from 'regl-gpu-lines';

import { Frame } from '../../lib/types';

export function drawStandard(
  reglCommand: regl.Regl,
  frame: Frame
): regl.DrawCommand<regl.DefaultContext> {
  return reglCommand({
    vert: `
      precision mediump float;
      attribute vec3 position;
      uniform mat4 view, projection;
      void main() {
        gl_Position = projection * view * vec4(position, 1.0);
      }`,

    frag: `
      precision mediump float;
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4(color, 1);
      }`,

    uniforms: {
      view: () => frame.scene.camera.viewMatrix,
      projection: () => frame.scene.camera.projectionMatrix,
    },
  });
}

export function drawLines(
  reglCommand: regl.Regl
): regl.DrawCommand<regl.DefaultContext> {
  return reglLines(reglCommand, {
    vert: `
    precision mediump float;

    #pragma lines: attribute vec2 xy;
    #pragma lines: position = getPosition(xy);
    vec4 getPosition(vec2 xy) {
      return vec4(xy, 0, 1);
    }

    #pragma lines: width = getWidth();
    uniform float width;
    float getWidth() {
      return width;
    }`,
    frag: `
    precision mediump float;
    void main () {
      gl_FragColor = vec4(1);
    }`,

    uniforms: {
      width: (ctx: regl.DefaultContext, props: { width: number }) =>
        ctx.pixelRatio * props.width,
    },
  });
}
