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
}

export const defaultInteractionConfig: InteractionConfig = {
  finePointerThreshold: 1,
  coarsePointerThreshold: 3,
  interactionDelay: 150,
};
