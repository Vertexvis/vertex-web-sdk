export interface InteractionConfig {
  /**
   * A scalar to be applied to the pixel thresholds for a fine pointer
   * input device (e.g. a mouse). This will affect pixel thresholds for
   * interactions at a rate of (N px * finePointerThresholdScale).
   */
  finePointerThresholdScale: number;

  /**
   * A scalar to be applied to the pixel thresholds for a coarse pointer
   * input device (e.g. touch). This will affect pixel thresholds
   * for interactions at a rate of (N px * devicePixelRatio * coarsePointerThresholdScale).
   */
  coarsePointerThresholdScale: number;
}

export const defaultInteractionConfig: InteractionConfig = {
  finePointerThresholdScale: 1,
  coarsePointerThresholdScale: 1.5,
};
