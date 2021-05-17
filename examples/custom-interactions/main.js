import { loadViewerWithQueryParams } from '../helpers.js';
import { defineCustomElements } from 'https://unpkg.com/@vertexvis/viewer@latest/dist/esm/loader.mjs';

class CustomInteractionHandler {
  constructor() {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  dispose() {
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
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
    this.element = element;
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('touchstart', this.handleTouchStart);
  }

  async handleTouchStart(event) {
    if (event.touches.length === 1) {
      window.addEventListener('touchmove', this.handleTouchMove);
      window.addEventListener('touchend', this.handleTouchEnd);

      this.setLastPosition(event.touches[0]);
    }
  }
  async handleMouseDown(event) {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setLastPosition(event);
  }

  /**
   * These methods utilize the InteractionApi provided to create a custom
   * camera pan interaction that is slightly modified (1/2 speed) from the base
   * pan interaction provided when the `camera-controls` property is true (default).
   */
  async handleTouchMove(event) {
    this.tryBeginInteraction();
    this.api.panCamera(this.getPositionDelta(event.touches[0]));
    this.setLastPosition(event.touches[0]);
  }
  async handleMouseMove(event) {
    this.tryBeginInteraction();
    this.api.panCamera(this.getPositionDelta(event));
    this.setLastPosition(event);
  }

  /**
   * These methods mark the end of the custom pan interaction, and
   * indicate that the interaction is complete through the `endInteraction`
   * method of the InteractionApi.
   */
  async handleTouchEnd() {
    window.removeEventListener('mousemove', this.handleTouchMove);
    window.removeEventListener('mouseup', this.handleTouchEnd);

    this.api.endInteraction();
    this.isInteracting = false;
  }
  async handleMouseUp() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);

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

  setLastPosition(eventPosition) {
    this.lastPosition = { x: eventPosition.clientX, y: eventPosition.clientY };
  }

  getPositionDelta(eventPosition) {
    return this.lastPosition != null
      ? {
          x: (eventPosition.clientX - this.lastPosition.x) * 0.5,
          y: (eventPosition.clientY - this.lastPosition.y) * 0.5,
        }
      : { x: 0, y: 0 };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  defineCustomElements(window).then(() => main());
});

async function main() {
  const viewer = document.querySelector('vertex-viewer');
  await loadViewerWithQueryParams(viewer);

  viewer.registerInteractionHandler(new CustomInteractionHandler());
}
