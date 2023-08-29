import { loadViewerWithQueryParams } from '../helpers.js';

window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');
  const viewer = document.querySelector('vertex-viewer');

  await loadViewerWithQueryParams(viewer);

  const walkModeTool = document.querySelector('vertex-viewer-walk-mode-tool');
  const increment = document.querySelector('#increment-speed');
  const decrement = document.querySelector('#decrement-speed');
  const walkSpeed = document.querySelector('#walk-speed');
  const teleportButton = document.querySelector('#teleport');
  const teleportAndAlignButton = document.querySelector('#teleport-and-align');

  window.addEventListener('keydown', (event) => {
    const controller = walkModeTool.controller;

    if (controller != null) {
      if (event.key === 'Escape') {
        walkModeTool.teleportMode = undefined;
      }
    }
  });

  let currentWalkSpeed = 5;

  increment.addEventListener('click', () => {
    const controller = walkModeTool.controller;

    if (controller != null) {
      currentWalkSpeed = Math.min(10, currentWalkSpeed + 1);
      controller.updateConfiguration({ keyboardWalkSpeed: currentWalkSpeed });
      walkSpeed.innerHTML = currentWalkSpeed;
    }
  });

  decrement.addEventListener('click', () => {
    const controller = walkModeTool.controller;

    if (controller != null) {
      currentWalkSpeed = Math.max(1, currentWalkSpeed - 1);
      controller.updateConfiguration({ keyboardWalkSpeed: currentWalkSpeed });
      walkSpeed.innerHTML = currentWalkSpeed;
    }
  });

  teleportButton.addEventListener('click', () => {
    walkModeTool.teleportMode = 'teleport';
  });

  teleportAndAlignButton.addEventListener('click', () => {
    walkModeTool.teleportMode = 'teleport-and-align';
  });
}
