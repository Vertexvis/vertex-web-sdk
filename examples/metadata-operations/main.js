import { loadViewerWithQueryParams } from '../helpers.js';
import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.22.x/dist/esm/loader.mjs';

document.addEventListener('DOMContentLoaded', () => {
  defineCustomElements(window).then(() => main());
});

async function main() {
  const viewer = document.getElementById('viewer');
  const metaKey = document.getElementById('metadata-key');
  const metaValue = document.getElementById('metadata-value');
  const searchBtn = document.getElementById('search-btn');
  const clearBtn = document.getElementById('clear-btn');

  searchBtn.addEventListener('click', () => {
    search(viewer, metaKey, metaValue);
  });
  clearBtn.addEventListener('click', () => {
    clear(viewer, metaKey, metaValue);
  });

  await loadViewerWithQueryParams(viewer);
}

async function search(viewer, metadataKey, metadataValue) {
  const scene = await viewer.scene();
  const key = metadataKey.value;
  const value = metadataValue.value;

  // Enable phantom mode for all items except the items that match the entered
  // metadata key/value.
  await scene
    .elements((op) => [
      op.where((q) => q.all()).setPhantom(true),
      op.where((q) => q.withMetadata(value, [key], false)).setPhantom(false),
    ])
    .execute();
}

async function clear(viewer, metadataKey, metadataValue) {
  metadataKey.value = '';
  metadataValue.value = '';

  // Clear phantom mode for all scene items.
  const scene = await viewer.scene();
  await scene
    .elements((op) => [op.where((q) => q.all()).clearPhantom()])
    .execute();
}
