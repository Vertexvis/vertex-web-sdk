import * as THREE from 'https://cdn.skypack.dev/three';

import { FlexTimeApi, VertexScene } from '/dist/viewer/index.esm.js';
import {
  getStreamKeyFromUrlParams,
  addGeometryLoaderMeshes,
} from '../utils.js';

import {
  glassPaneFragmentShader,
  quadVertexShader,
} from './featureRolloverShaders.js';

class FeatureRolloverInteractionHandler {
  constructor(renderer, scene, uniforms) {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.blendedRenderer = renderer;
    this.quadUniforms = uniforms;
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.handleMouseDown);
    window.removeEventListener('pointermove', this.handleMouseMove);
    this.postMaterial.dispose();
  }

  /**
   * The initialize method of your custom interaction handler will be called
   * whenever it is registered with the viewer through viewer.registerInteractionHandler().
   * The element provided is a reference to the canvas where the vertex-viewer component
   * will draw images that it receives. Event listeners can be added to this element to
   * drive custom interactions.
   *
   * The api provided is an instance of the InteractionApi of the vertex-viewer,
   * which exposes methods that can be used to modify the internal state of an interaction.
   * This allows for control over things like the beginning and ending of interactions, or
   * transformation of the camera through pan, zoom, and rotate helpers.
   *
   * @param {*} element the reference to the canvas element.
   * @param {*} api the instance of the InteractionApi.
   */
  initialize(element, api) {
    this.api = api;
    this.viewport = this.api.getViewport();
    this.element = element;
    this.element.addEventListener('pointerdown', this.handleMouseDown);
    this.element.addEventListener('pointermove', this.handleMouseMove);
  }

  async handleMouseDown(event) {
    // add the listener that will enable rollover
    window.addEventListener('pointerup', this.handleMouseUp);
    // remove the rollover listener
    window.removeEventListener('pointermove', this.handleMouseMove);
    this.tryBeginInteraction();
    // update the shader
    this.quadUniforms.u_highlightFeature.value = false;
  }

  async handleMouseMove(event) {
    if (!this.isInteracting) {
      // translate mouse position to texture coordinates relative to the canvas
      var rect = event.target.getBoundingClientRect();
      var mouse_x = event.clientX - rect.left;
      var mouse_y = event.clientY - rect.top;
      const x = mouse_x / this.viewport.width;
      const y = 1 - mouse_y / this.viewport.height;
      this.quadUniforms.featureMap.value.needsUpdate = true;
      this.quadUniforms.u_mouse = {
        value: [x, y],
      };
      // update!!
      this.blendedRenderer.draw();
    }
  }

  async handleMouseUp() {
    // enable feature hightligting when not moving
    this.quadUniforms.u_highlightFeature.value = true;
    this.api.endInteraction();
    this.isInteracting = false;
  }

  /**
   * Marks the beginning of an interaction if it has not already been marked.
   * This call to `beginInteraction` is required prior to any transformation of
   * the camera.
   */
  tryBeginInteraction() {
    if (!this.isInteracting) {
      this.api.beginInteraction();
      this.isInteracting = true;
    }
  }
}

const streamKey = '' || getStreamKeyFromUrlParams();
const sceneId = '54c7a35a-a818-4b35-bd5e-c26d78945f98';
const client = FlexTimeApi.create('https://flex.platdev.vertexvis.io');
const vertexScene = new VertexScene(client, sceneId);

window.addEventListener('DOMContentLoaded', () => {
  main();
});
async function* getQuadAsMeshes(uniforms) {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: quadVertexShader,
    fragmentShader: glassPaneFragmentShader,
    uniforms: uniforms,
  });
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  yield Array(quad);
}

async function main() {
  await window.customElements.whenDefined('vertex-viewer');
  const viewer = document.getElementById('viewer');
  // uses vru to load geometry into the canvas/viewer
  await viewer.load(`urn:vertexvis:stream-key:${streamKey}`);

  const blendedRenderer = document.getElementById('blended-renderer');
  // TODO fake the feature map using the content of the canvas
  const texture = new THREE.CanvasTexture(
    viewer.shadowRoot.querySelector('canvas')
  );
  texture.magFilter = THREE.Linear;
  texture.minFilter = THREE.Linear;
  // initialize uniforms for the hightlight shaders
  var uniforms = {
    featureMap: { type: 't', value: texture },
    u_mouse: { value: [0, 0] },
    u_featureHighlightColor: { value: [0, 1, 0, 1] },
    u_highlightFeature: { value: false },
  };
  blendedRenderer.willDraw = updateScene(viewer, vertexScene);
  blendedRenderer.scene.add(vertexScene);
  // This is essentialy a scene that is a full screen quad that takes in a texture
  // that is assumed to be a feature map. A shader is used to select all
  // fragments in the texture that are the same color as the color under the mouse.
  // The mouse position is sent in as a uniform that is used as a texture coordinate. 
  // TODO: use the real feature map from "flexy-time"
  const meshes = getQuadAsMeshes(uniforms);
  // hijacked from three-animation example
  await addGeometryLoaderMeshes(blendedRenderer, vertexScene, meshes);
  // interaciton handler that updates mouse position for the shader on mouse moves
  viewer.registerInteractionHandler(
    new FeatureRolloverInteractionHandler(
      blendedRenderer,
      vertexScene,
      uniforms
    )
  );

  // this handles picking separately from the rollover...
  // maybe should be in the same handelr but it is leftover from the example
  viewer.addEventListener('tap', async ({ detail }) => {
    const { position } = detail;
    const [localHit] = await blendedRenderer.hit(position);

    if (localHit != null) {
      select(localHit.object.parent);
    } else {
      const scene = await viewer.scene();
      const { hits } = await scene.raycaster().hitItems(detail.position);
      const [hit] = hits;

      if (hit != null) {
        console.log('hit', hit);
      }
    }
  });
}

function updateScene(viewer, scene) {
  return () => {
    if (viewer.frame != null) {
      scene.updateLighting(viewer.frame.scene.camera);
    }
  };
}
// TODO replace the CanvasTexture with a DataTexture that gets filled in 
// from calls to "flexy-time"
//  async function updateFeatureMapTexture(
//   frame: Frame,
//   viewport: Viewport
// ): Promise<DataTexture> {
//   const { x, y, width, height } = viewport.calculateDrawRect(frame.image);
//   const image = frame.image.imageBytes;
//   if (image != null) {
//     const dataTexture = new DataTexture(image, width, height, RGBAFormat);
//     dataTexture.magFilter = NearestFilter;
//     dataTexture.minFilter = NearestFilter;
//     dataTexture.needsUpdate = true;
//     return dataTexture;
//   } else {
//     return this.featureMap;
//   }
// }
///this.featureMap = new DataTexture(new Uint8Array(), 2, 2);
// this.featureMap.format = RGBAFormat;
// this.featureMap.magFilter = NearestFilter;
// this.featureMap.minFilter = NearestFilter;
// this.featureMap.needsUpdate = true;
