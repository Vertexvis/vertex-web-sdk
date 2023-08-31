window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');

  const walkModeTool = document.querySelector('vertex-viewer-walk-mode-tool');
  const increment = document.querySelector('#increment-speed');
  const decrement = document.querySelector('#decrement-speed');
  const walkSpeed = document.querySelector('#walk-speed');
  const teleportTowardButton = document.querySelector('#teleport-toward');
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

  /**
   * Enables the `teleport` mode when clicked.
   * See https://github.com/Vertexvis/vertex-web-sdk/blob/master/packages/viewer/src/components/viewer-teleport-tool/readme.md
   * for more details on the various modes.
   */
  teleportTowardButton.addEventListener('click', () => {
    if (walkModeTool.teleportMode === 'teleport-toward') {
      teleportTowardButton.style = undefined;
      walkModeTool.teleportMode = undefined;
    } else {
      teleportAndAlignButton.style = undefined;
      teleportButton.style = undefined;
      teleportTowardButton.style = "color: #0099cc";
      walkModeTool.teleportMode = 'teleport-toward';
    }
  });

  /**
   * Enables the `teleport` mode when clicked.
   * See https://github.com/Vertexvis/vertex-web-sdk/blob/master/packages/viewer/src/components/viewer-teleport-tool/readme.md
   * for more details on the various modes.
   */
  teleportButton.addEventListener('click', () => {
    if (walkModeTool.teleportMode === 'teleport') {
      teleportButton.style = undefined;
      walkModeTool.teleportMode = undefined;
    } else {
      teleportAndAlignButton.style = undefined;
      teleportTowardButton.style = undefined;
      teleportButton.style = "color: #0099cc";
      walkModeTool.teleportMode = 'teleport';
    }
  });

  /**
   * Enables the `teleport-and-align` mode when clicked.
   * See https://github.com/Vertexvis/vertex-web-sdk/blob/master/packages/viewer/src/components/viewer-teleport-tool/readme.md
   * for more details on the various modes.
   */
  teleportAndAlignButton.addEventListener('click', () => {
    if (walkModeTool.teleportMode === 'teleport-and-align') {
      teleportAndAlignButton.style = undefined;
      walkModeTool.teleportMode = undefined;
    } else {
      teleportButton.style = undefined;
      teleportTowardButton.style = undefined;
      teleportAndAlignButton.style = "color: #0099cc";
      walkModeTool.teleportMode = 'teleport-and-align';
    }
  });

  walkModeTool.addEventListener('controllerChanged', event => {
    const controller = event.detail;

  /* Custom keys for interactions */

  /**
   * Appending to existing keybindings:
   * 
   * // With the `ViewerWalkModeOperation` enum values
   * controller.addKeyBinding(ViewerWalkModeOperation.WALK_FORWARD, 'ArrowUp');
   * 
   * // Without the `ViewerWalkModeOperation` enum values
   * controller.addKeyBinding('WALK_FORWARD', 'ArrowUp');
   */

  /**
   * Replacing existing keybindings:
   * 
   * // With the `ViewerWalkModeOperation` enum values
   * controller.replaceKeyBinding(ViewerWalkModeOperation.WALK_FORWARD, 'ArrowUp');
   * 
   * // Without the `ViewerWalkModeOperation` enum values
   * controller.replaceKeyBinding('WALK_FORWARD', 'ArrowUp');
   * 
   * **Note**
   * Replacing a keybinding will not remove other bindings for that specific key,
   * but they can be removed using the same method and providing an empty set of keys.
   * 
   * // Removing a keybinding (the `PIVOT_UP` action would normally be bound to `ArrowUp`)
   * controller.replaceKeyBinding('PIVOT_UP');
   */
  });
}
