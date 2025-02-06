import { getStreamKey } from '../helpers.js';
import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/esm/loader.mjs';

document.addEventListener('DOMContentLoaded', () => {
  defineCustomElements(window).then(() => main());
});

async function main() {
  const viewer = document.querySelector('vertex-viewer');
  const streamKey = getStreamKey();

  loadModelByStreamKey(viewer, streamKey);
}

/**
 * Loads a scene by a Vertex stream key. For more information
 * on generating a stream key, see https://developer.vertexvis.com/docs/guides/authentication#viewer-component
 */
async function loadModelByStreamKey(viewer, streamKey) {
  await viewer.load(`urn:vertex:stream-key:${streamKey}`);
}
