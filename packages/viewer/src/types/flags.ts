import { Objects } from '@vertexvis/utils';

/**
 * A set of experimental features that can be enabled through the viewer's
 * config.
 */
export interface Flags {
  /**
   * Enables or disables a buffer for delivery of images over websockets.
   */
  bufferFrameDelivery: boolean;
}

export const defaultFlags: Flags = {
  bufferFrameDelivery: false,
};

export function createFlags(
  features: Partial<Flags>,
  fallbacks: Partial<Flags> = defaultFlags
): Flags {
  return Objects.defaults(features, fallbacks, defaultFlags);
}
