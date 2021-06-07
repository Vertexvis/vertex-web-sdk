import { Disposable } from '@vertexvis/utils';
import { InteractionApi } from './interactionApi';

/**
 * An `InteractionHandler` provides a mechanism for customizing the mouse and
 * touch handling in the viewer.
 *
 * When an interaction handler is registered with the viewer, it'll call the
 * `initialize()` method and pass it the internal canvas element and an instance
 * of an `InteractionApi` that can be used to modify the internal interaction
 * state.
 *
 * @example
 * ```
 * class CustomInteractionHandler extends InteractionHandler {
 *   private element: HTMLElement;
 *   private api: InteractionApi;
 *
 *   public dispose(): void {
 *     this.element.removeEventListener('click', this.handleElementClick);
 *   }
 *
 *   public initialize(element: HTMLElement, api: InteractionApi): void {
 *     this.api = api;
 *     this.element = element;
 *     this.element.addEventListener('click', this.handleElementClick);
 *   }
 *
 *   private handleElementClick = (event: MouseEvent) => {
 *     api.pick({ x: event.clientX, y: event.clientY });
 *   }
 * }
 *
 * const viewer = document.querySelector("vertex-viewer");
 * viewer.registerInteractionHandler(new CustomInteractionHandler);
 * ```
 */
export interface InteractionHandler extends Disposable {
  /**
   * Called by the viewer when the interaction handler is registered with the
   * viewer. Used to setup any necessary event listeners to handle user
   * interactions.
   *
   * @param element The internal viewer element to add event listeners to.
   * @param api The API to modify internal interaction state.
   */
  initialize(element: HTMLElement, api: InteractionApi): void;
}
