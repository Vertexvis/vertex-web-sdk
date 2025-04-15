import { FrameDeliverySettings } from '@vertexvis/stream-api';
import {
  AdaptiveRenderingSettings,
  QualityOfServiceSettings,
} from '@vertexvis/stream-api';
import { DeepPartial, Objects } from '@vertexvis/utils';

import { Environment } from './environment';
import { Animation, Events, Flags, Interactions } from './types';

interface NetworkConfig {
  apiHost: string;
  renderingHost: string;
  sceneTreeHost: string;
  sceneViewHost: string;
}

export interface Config {
  network: NetworkConfig;
  flags: Flags.Flags;
  events: Events.EventConfig;
  animation: Animation.AnimationConfig;
  interactions: Interactions.InteractionConfig;
  EXPERIMENTAL_frameDelivery: Omit<
    FrameDeliverySettings,
    'rateLimitingEnabled'
  >;
  EXPERIMENTAL_adaptiveRendering: Omit<AdaptiveRenderingSettings, 'enabled'>;
  EXPERIMENTAL_qualityOfService: QualityOfServiceSettings;
  EXPERIMENTAL_annotationPollingIntervalInMs: number | undefined;
}

export type PartialConfig = DeepPartial<Config>;

export type ConfigProvider = () => Config;

export type InteractionConfigProvider = () => Interactions.InteractionConfig;

const config: Config = {
  network: {
    apiHost: 'https://platform.platprod.vertexvis.io',
    renderingHost: 'wss://stream.platprod.vertexvis.io',
    sceneTreeHost: 'https://scene-trees.platprod.vertexvis.io',
    sceneViewHost: 'https://scenes.platprod.vertexvis.io',
  },
  flags: Flags.defaultFlags,
  events: Events.defaultEventConfig,
  animation: Animation.defaultAnimationConfig,
  interactions: Interactions.defaultInteractionConfig,
  EXPERIMENTAL_frameDelivery: {},
  EXPERIMENTAL_adaptiveRendering: {},
  EXPERIMENTAL_qualityOfService: {},
  EXPERIMENTAL_annotationPollingIntervalInMs: undefined,
};

const platdevConfig: Config = {
  ...config,
  network: {
    apiHost: 'https://platform.platdev.vertexvis.io',
    renderingHost: 'wss://stream.platdev.vertexvis.io',
    sceneTreeHost: 'https://scene-trees.platdev.vertexvis.io',
    sceneViewHost: 'https://scenes.platdev.vertexvis.io',
  },
};

const platstagingConfig: Config = {
  ...config,
  network: {
    apiHost: 'https://platform.platstaging.vertexvis.io',
    renderingHost: 'wss://stream.platstaging.vertexvis.io',
    sceneTreeHost: 'https://scene-trees.platstaging.vertexvis.io',
    sceneViewHost: 'https://scenes.platstaging.vertexvis.io',
  },
};

function getEnvironmentConfig(environment: Environment): Config {
  switch (environment) {
    case 'platdev':
      return platdevConfig;
    case 'platstaging':
      return platstagingConfig;
    default:
      return config;
  }
}

export function parseAndValidateConfig(
  environment: Environment = 'platprod',
  config?: string | PartialConfig
): Config {
  const parsed = parseConfig(environment, config);

  return validateConfig(sanitizeConfig(parsed));
}

export function parseConfig(
  environment: Environment = 'platprod',
  config?: string | PartialConfig
): Config {
  if (typeof config === 'string') {
    config = JSON.parse(config) as PartialConfig;
  }

  const envConfig = getEnvironmentConfig(environment);

  if (config == null) {
    return envConfig;
  } else {
    return Objects.defaults({ ...config }, envConfig);
  }
}

export function sanitizeConfig(config: Config): Config {
  const sanitizedApiHost = config.network.apiHost.trim();
  const sanitizedRenderingHost = config.network.renderingHost.trim();
  const sanitizedSceneTreeHost = config.network.sceneTreeHost.trim();
  const sanitizedSceneViewHost = config.network.sceneViewHost.trim();

  return {
    ...config,
    network: {
      ...config.network,
      apiHost: sanitizedApiHost,
      renderingHost: sanitizedRenderingHost,
      sceneTreeHost: sanitizedSceneTreeHost,
      sceneViewHost: sanitizedSceneViewHost,
    },
  };
}

export function validateConfig(config: Config): Config {
  validateUrlScheme(config.network, 'apiHost', 'https://');
  validateUrlScheme(config.network, 'renderingHost', 'wss://');
  validateUrlScheme(config.network, 'sceneTreeHost', 'https://');
  validateUrlScheme(config.network, 'sceneViewHost', 'https://');

  return config;
}

function validateUrlScheme(
  networkConfig: NetworkConfig,
  field: keyof NetworkConfig,
  expectedScheme: string
): void {
  if (!networkConfig[field].startsWith(expectedScheme)) {
    throw new Error(
      `Invalid ${field} specified. The URL must start with the ${expectedScheme} scheme.`
    );
  }
}
