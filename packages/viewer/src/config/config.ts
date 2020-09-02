import { Objects, DeepPartial } from '@vertexvis/utils';
import { Environment } from './environment';
import { Flags } from '../types';

interface NetworkConfig {
  apiHost: string;
  renderingHost: string;
}

export interface Config {
  network: NetworkConfig;
  flags: Flags.Flags;
}

type PartialConfig = DeepPartial<Config>;

export type ConfigProvider = () => Config;

const platdevConfig: Config = {
  network: {
    apiHost: 'https://platform.platdev.vertexvis.io',
    renderingHost: 'wss://stream.platdev.vertexvis.io',
  },
  flags: Flags.defaultFlags,
};

const platprodConfig: Config = {
  network: {
    apiHost: 'https://platform.platprod.vertexvis.io',
    renderingHost: 'wss://stream.platprod.vertexvis.io',
  },
  flags: Flags.defaultFlags,
};

function getEnvironmentConfig(environment: Environment): Config {
  switch (environment) {
    case 'platdev':
      return platdevConfig;
    default:
      return platprodConfig;
  }
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
