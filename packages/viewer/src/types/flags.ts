import { Objects } from '@vertexvis/utils';

type Flag =
  /**
   * Enables or disables a throttling of image delivery based on detected
   * network conditions.
   */
  | 'throttleFrameDelivery'

  /**
   * Enables or disables automatic quality adjustments of rendered frames to
   * improve the performance of delivering frames to the client.
   */
  | 'adaptiveRendering'

  /**
   * Enables or disables logging of WS message payloads.
   */
  | 'logWsMessages';

/**
 * A set of experimental features that can be enabled through the viewer's
 * config.
 */
export type Flags = { [K in Flag]: boolean };

export const defaultFlags: Flags = {
  throttleFrameDelivery: false,
  adaptiveRendering: false,
  logWsMessages: false,
};

export function createFlags(
  features: Partial<Flags>,
  fallbacks: Partial<Flags> = defaultFlags
): Flags {
  return Objects.defaults(features, fallbacks, defaultFlags);
}
