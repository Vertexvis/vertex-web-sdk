window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');

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
    if (walkModeTool.teleportMode === 'teleport') {
      teleportButton.style = undefined;
      walkModeTool.teleportMode = undefined;
    } else {
      teleportAndAlignButton.style = undefined;
      teleportButton.style = "color: #0099cc";
      walkModeTool.teleportMode = 'teleport';
    }
  });

  teleportAndAlignButton.addEventListener('click', () => {
    if (walkModeTool.teleportMode === 'teleport-and-align') {
      teleportAndAlignButton.style = undefined;
      walkModeTool.teleportMode = undefined;
    } else {
      teleportButton.style = undefined;
      teleportAndAlignButton.style = "color: #0099cc";
      walkModeTool.teleportMode = 'teleport-and-align';
    }
  });
}
