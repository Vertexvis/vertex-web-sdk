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

  bufferVariationThreshold: number;

  bufferHistoryMaxSize: number;

  bufferFrameTimeout: string;

  bufferFrameTimeoutThreshold: number;

  /**
   * Enables or disables logging of WS message payloads.
   */
  logWsMessages: boolean;
}

export const defaultFlags: Flags = {
  bufferFrameDelivery: false,
  logWsMessages: false,
  bufferVariationThreshold: 0.3,
  bufferHistoryMaxSize: 10,
  bufferFrameTimeout: '500ms',
  bufferFrameTimeoutThreshold: 0.5,
};

export function createFlags(
  features: Partial<Flags>,
  fallbacks: Partial<Flags> = defaultFlags
): Flags {
  return Objects.defaults(features, fallbacks, defaultFlags);
}
