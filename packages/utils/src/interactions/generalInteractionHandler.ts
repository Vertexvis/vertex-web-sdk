import { Disposable } from '../disposable';

/**
 * An `GeneralInteractionHandler` provides a mechanism for customizing the mouse and
 * touch handling in the viewer.
 *
 * When an interaction handler is registered with the viewer, it'll call the
 * `initialize()` method and pass it the internal canvas element that can be
 * used to modify the internal interaction state.
 *
 * @example
 * ```
 * class CustomInteractionHandler extends GeneralInteractionHandler {
 *   private element: HTMLElement;
 *
 *   public dispose(): void {
 *     this.element.removeEventListener('click', this.handleElementClick);
 *   }
 *
 *   public initialize(element: HTMLElement): void {
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
export interface GeneralInteractionHandler extends Disposable {
  /**
   * Called by the viewer when the interaction handler is registered with the
   * viewer. Used to setup any necessary event listeners to handle user
   * interactions.
   *
   * @param element The internal viewer element to add event listeners to.
   */
  initialize(element: HTMLElement): void;
}
