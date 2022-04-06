import regl from 'regl';

import { Frame } from '../../lib/types';

export function draw(
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
