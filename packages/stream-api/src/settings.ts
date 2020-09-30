import { Uri, Objects } from '@vertexvis/utils';
import {
  defineParams,
  defineBoolean,
  defineNumber,
  defineString,
  ParamsBuilder,
} from './paramsBuilder';

/**
 * Settings to configure the delivery of images over the websocket connection.
 */
export interface FrameDeliverySettings {
  /**
   * Indicates if the rate limiting of frame delivery is enabled based on
   * detected internet throughput.
   */
  rateLimitingEnabled?: boolean;

  /**
   * Enables rate limiting when the variation coefficient of frame latencies
   * exceeds this threshold. The variation coefficient is defined by the
   * standard deviation of latencies over the average of recorded latencies.
   *
   * Lower numbers will increase the aggressiveness of packet loss detection,
   * but may trigger unexpected delivery rate limiting.
   */
  packetLossThreshold?: number;

  /**
   * The maximum number of latencies to record. Higher numbers could result in
   * more delay before packet loss is detected. Lower numbers could result in
   * packet loss not being detected.
   */
  historyMaxSize?: number;

  /**
   * The duration at which point a frame will be considered failed if the server
   * has not received an acknowledgement.
   */
  timeout?: string;

  /**
   * Enables rate limiting when the number of frames that failed to receive an
   * acknowledgement within the timeout window exceeds this ratio.
   */
  timeoutRatioThreshold?: number;
}

/**
 * Settings to configure the frame stream and its websocket connection.
 */
export interface Settings {
  /**
   * **EXPERIMENTAL.** Settings to configure the delivery of frames.
   */
  EXPERIMENTAL_frameDelivery?: FrameDeliverySettings;
}

export function appendSettingsToUrl(url: string, settings: Settings): string {
  const defaults: Settings = {
    // Settings that you want to set on each WS connection should go here.
  };

  const uri = Uri.parse(url);
  const builder = defineParams(
    toFrameDeliverySettingsParams(defaults.EXPERIMENTAL_frameDelivery)
  );
  const params = builder(settings);
  return Uri.toString(Uri.addQueryParams(params, uri));
}

function toFrameDeliverySettingsParams(
  defaults: FrameDeliverySettings | undefined
): ParamsBuilder<Settings> {
  return defineSettings(
    s => s.EXPERIMENTAL_frameDelivery,
    defaults,
    defineParams(
      defineBoolean('frame-delivery.rate-limit-enabled', 'rateLimitingEnabled'),
      defineNumber(
        'frame-delivery.packet-loss-threshold',
        'packetLossThreshold'
      ),
      defineNumber('frame-delivery.history-max-size', 'historyMaxSize'),
      defineString('frame-delivery.timeout', 'timeout'),
      defineNumber(
        'frame-delivery.timeout-ratio-threshold',
        'timeoutRatioThreshold'
      )
    )
  );
}

function defineSettings<S, T>(
  getter: (settings: S) => T | undefined,
  defaults: T | undefined,
  builder: ParamsBuilder<T>
): ParamsBuilder<S> {
  return settings => {
    const merged = Objects.defaults(getter(settings) || {}, defaults);
    return builder(merged);
  };
}
