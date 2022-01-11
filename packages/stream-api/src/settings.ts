import { Objects, Uri } from '@vertexvis/utils';

import {
  defineBoolean,
  defineNumber,
  defineParams,
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
 * Settings to configure the adaptive rendering of images. If enabled, the
 * performance of delivering images is analyzed, and will be adjusted to deliver
 * frames quicker to the client.
 */
export interface AdaptiveRenderingSettings {
  /**
   * Indicates if adaptive rendering is enabled.
   */
  enabled?: boolean;

  /**
   * The adaptive rendering algorithm to use. Defaults to `median`.
   */
  method?:
    | 'median'
    | 'average'
    | 'smoothed-median'
    | 'median-of-smoothed-median'
    | 'average-of-smoothed-median';

  /**
   * A number between 1 and 100 representing the minimum JPEG quality for
   * rendered frames.
   */
  jpegMinQuality?: number;

  /**
   * A number between 1 and 100 representing the maximum JPEG quality for
   * rendered frames.
   */
  jpegMaxQuality?: number;

  /**
   * A number between 0 and 1 representing the minimum scale factor for rendered
   * frames.
   */
  imageMinScale?: number;

  /**
   * A number between 0 and 1 representing the maximum scale factor for rendered
   * frames.
   */
  imageMaxScale?: number;

  /**
   * The window size to use for smoothing based adaptive rendering methods. This
   * applies to: `smoothed-median`, `median-of-smoothed-median`,
   * `average-of-smoothed-median`. Higher window sizes will result in values
   * that are more smoothed, and have less "wave" like behavior to image
   * quality. However, higher window sizes will take longer to respond to
   * changes in network conditions.
   */
  windowSize?: number;
}

/**
 * Settings to configure the quality of service metrics used by the server.
 */
export interface QualityOfServiceSettings {
  /**
   * Specifies how many timings to track before old timings are purged.
   */
  historyMaxSize?: number;
}

/**
 * Settings to configure the frame stream and its websocket connection.
 */
export interface Settings {
  /**
   * **EXPERIMENTAL.** Settings to configure the delivery of frames.
   */
  EXPERIMENTAL_frameDelivery?: FrameDeliverySettings;

  /**
   * **EXPERIMENTAL.** Settings to configure adaptive rendering of frames.
   */
  EXPERIMENTAL_adaptiveRendering?: AdaptiveRenderingSettings;

  /**
   * **EXPERIMENTAL.** Settings to configure quality of service.
   */
  EXPERIMENTAL_qualityOfService?: QualityOfServiceSettings;
}

export function appendSettingsToUrl(url: string, settings: Settings): string {
  const defaults: Settings = {
    // Settings that you want to set on each WS connection should go here.
  };

  const uri = Uri.parse(url);
  const builder = defineParams(
    toFrameDeliverySettingsParams(defaults.EXPERIMENTAL_frameDelivery),
    toAdaptiveRenderingSettingsParams(defaults.EXPERIMENTAL_adaptiveRendering),
    toQualityOfServiceSettingsParams(defaults.EXPERIMENTAL_qualityOfService)
  );
  const params = builder(settings);
  return Uri.toString(Uri.addQueryParams(params, uri));
}

function toFrameDeliverySettingsParams(
  defaults: FrameDeliverySettings | undefined
): ParamsBuilder<Settings> {
  return defineSettings(
    (s) => s.EXPERIMENTAL_frameDelivery,
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

function toAdaptiveRenderingSettingsParams(
  defaults: AdaptiveRenderingSettings | undefined
): ParamsBuilder<Settings> {
  return defineSettings(
    (s) => s.EXPERIMENTAL_adaptiveRendering,
    defaults,
    defineParams(
      defineBoolean('adaptive-rendering.enabled', 'enabled'),
      defineString('adaptive-rendering.method', 'method'),
      defineNumber('adaptive-rendering.jpeg-quality-min', 'jpegMinQuality'),
      defineNumber('adaptive-rendering.jpeg-quality-max', 'jpegMaxQuality'),
      defineNumber('adaptive-rendering.image-scale-min', 'imageMinScale'),
      defineNumber('adaptive-rendering.image-scale-max', 'imageMaxScale'),
      defineNumber('adaptive-rendering.window-size', 'windowSize')
    )
  );
}

function toQualityOfServiceSettingsParams(
  defaults: QualityOfServiceSettings | undefined
): ParamsBuilder<Settings> {
  return defineSettings(
    (s) => s.EXPERIMENTAL_qualityOfService,
    defaults,
    defineParams(defineNumber('qos.history-max-size', 'historyMaxSize'))
  );
}

function defineSettings<S, T>(
  getter: (settings: S) => T | undefined,
  defaults: T | undefined,
  builder: ParamsBuilder<T>
): ParamsBuilder<S> {
  return (settings) => {
    const merged = Objects.defaults(getter(settings) || {}, defaults);
    return builder(merged);
  };
}
