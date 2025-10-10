export interface InteractionConfig {
  /**
   * The amount of movement required with a fine (mouse, trackpad, etc) pointer
   * input before an interaction is considered a movement that will update the
   * camera. This threshold is always scaled up based on the device's pixel ratio.
   */
  finePointerThreshold: number;

  /**
   * The amount of movement required with a coarse (touch, stylus, etc) pointer
   * input before an interaction is considered a movement that will update the
   * camera. This threshold is always scaled up based on the device's pixel ratio.
   */
  coarsePointerThreshold: number;

  /**
   * The amount of time before a movement is considered an interaction and will
   * update the camera.
   */
  interactionDelay: number;

  /**
   * Whether the `zoomCameraToPoint` interaction through the `InteractionApiPerspective`
   * will enforce a minimum distance when moving the camera. When set, the camera will be
   * able to move through geometry under the cursor, rather than being restricted by the
   * point under the cursor. Defaults to `true`.
   */
  useMinimumPerspectiveZoomDistance: boolean;

  /**
   * The amount of time before a wheel interaction is ended.
   *
   * This delay is used to support successive sets of mouse events, and not cause
   * abrupt and unexpected ending of mouse interactions during natural pauses in mouse
   * wheel usage.
   */
  mouseWheelInteractionEndDebounce: number;

  /**
   * Reverses which direction the mouse wheel considers positive or negative
   * for zoom interactions.
   */
  reverseMouseWheelDirection: boolean;
}

export const defaultInteractionConfig: InteractionConfig = {
  finePointerThreshold: 1,
  coarsePointerThreshold: 3,
  interactionDelay: 75,
  useMinimumPerspectiveZoomDistance: true,
  mouseWheelInteractionEndDebounce: 150,
  reverseMouseWheelDirection: false,
};
