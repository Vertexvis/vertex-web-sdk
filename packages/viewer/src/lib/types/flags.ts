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
  | 'logWsMessages'

  /**
   * Toggles the logging of frame rates.
   */
  | 'logFrameRate'

  /**
   * Enables or disables the letterboxing of frames when the host dimensions
   * are larger than the supported maximum image size (1080p). By default
   * this option is disabled, and images will be scaled up to match the host.
   */
  | 'letterboxFrames'

  /**
   * Enables or disables the use of the `grpc.WebsocketTransport` for streaming
   * RPCs. By default this transport will be used, and streaming messages will
   * be sent over WebSocket.
   */
  | 'grpcUseStreamingWebSocketTransport';

/**
 * A set of experimental features that can be enabled through the viewer's
 * config.
 */
export type Flags = { [K in Flag]: boolean };

export const defaultFlags: Flags = {
  throttleFrameDelivery: true,
  adaptiveRendering: true,
  logWsMessages: false,
  logFrameRate: false,
  letterboxFrames: false,
  grpcUseStreamingWebSocketTransport: true,
};

export function createFlags(
  features: Partial<Flags>,
  fallbacks: Partial<Flags> = defaultFlags
): Flags {
  return Objects.defaults(features, fallbacks, defaultFlags);
}
