import { THREE } from '../dependencies.js';
import {
  FlexTimeApi,
  SurfaceMeasurement,
  VertexScene,
} from '/dist/viewer/index.esm.js';
import { addGeometryLoaderMeshes } from '../utils.js';
import {
  glassPaneFragmentShader,
  quadVertexShader,
} from '../rollover/featureRolloverShaders.js';
import {
  loadViewerWithQueryParams,
  readDebugFeatureMap,
  readSceneId,
} from '../utils.js';
import { FeatureRolloverInteractionHandler } from '../rollover/featureRolloverHandler.js';

const sceneId = readSceneId(); //'464b4f18-387e-4a8e-8d6f-fffe289dd892'; //'54c7a35a-a818-4b35-bd5e-c26d78945f98';
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
  viewer.featureLines = {
    width: 1.0,
    color: {
      r: 0,
      g: 0,
      b: 0,
      a: 1,
    },
  };
  await loadViewerWithQueryParams(viewer);
  const blendedRenderer = document.getElementById('blended-renderer');
  // // TODO this setup can probably be pulled out into it's own class/module
  // // TODO setup the feature map using the content of the canvas
  const featureMapCanvas = getCanvasForFeatureMapTexture();
  const featureMapTexture = new THREE.CanvasTexture(featureMapCanvas);
  featureMapTexture.magFilter = THREE.NearestFilter;
  featureMapTexture.minFilter = THREE.NearestFilter;
  const diffuseCanvas = viewer.shadowRoot.querySelector('canvas');
  const diffuseMapTexture = new THREE.CanvasTexture(diffuseCanvas);
  diffuseMapTexture.magFilter = THREE.NearestFilter;
  diffuseMapTexture.minFilter = THREE.NearestFilter;
  // initialize uniforms for the hightlight shaders
  var uniforms = {
    featureMap: { type: 't', value: featureMapTexture },
    diffuseMap: { type: 't', value: diffuseMapTexture },
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
  const rolloverHandler = new FeatureRolloverInteractionHandler(
    blendedRenderer,
    client,
    featureMapCanvas.getContext('2d'),
    uniforms,
    sceneId
  );
  const debugFeatureMapChk = document.getElementById('debug-feature-map');
  debugFeatureMapChk.onchange = () => {
    rolloverHandler.enableShowFeatureMap(debugFeatureMapChk.checked);
  };
  debugFeatureMapChk.checked = readDebugFeatureMap();
  // const enableRolloverChk = document.getElementById('enable-rollover');
  // enableRolloverChk.onchange = () => {
  //   uniforms.u_highlightFeature.value = enableRolloverChk.checked;
  //   uniforms.u_highlightFeature.needsUpdate = true;
  // };
  // interaciton handler that updates mouse position for the shader on mouse moves
  viewer.registerInteractionHandler(rolloverHandler);

  setupMeasurement(viewer, new VertexScene());
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

function setupMeasurement(viewer, measurementScene) {
  const clearMeasurementsBtn = document.getElementById(
    'clear-measurements-btn'
  );
  const showHelpersCheckbox = document.getElementById('show-helpers-checkbox');
  const renderer = document.getElementById('measurement-renderer');
  renderer.willDraw = updateScene(viewer, measurementScene);
  renderer.scene.add(measurementScene);

  // const interactionTarget = await viewer.getInteractionTarget();

  const surfaceMeasurement = new SurfaceMeasurement(
    renderer,
    measurementScene,
    sceneId,
    'https://flex.platdev.vertexvis.io'
  );
  viewer.registerInteractionHandler(surfaceMeasurement);
  clearMeasurementsBtn.addEventListener('click', () => {
    surfaceMeasurement.clear();
  });

  showHelpersCheckbox.addEventListener('change', () => {
    surfaceMeasurement.showHelpers = showHelpersCheckbox.checked;
  });
}

function updateScene(viewer, scene) {
  return () => {
    if (viewer.frame != null) {
      scene.updateLighting(viewer.frame.scene.camera);
    }
  };
}

function getCanvasForFeatureMapTexture() {
  const offscreen = document.createElement('canvas');
  offscreen.setAttribute('id', 'offscreen');
  return offscreen;
}
