import { Objects, DeepPartial } from '@vertexvis/utils';
import { Environment } from './environment';

interface NetworkConfig {
  apiHost: string;
  renderingHost: string;
}

export interface Config {
  network: NetworkConfig;
}

export type ConfigProvider = () => Config;

export const defaultConfig: DeepPartial<Config> = {};

const platdevConfig: Config = {
  network: {
    apiHost: 'https://platform.platdev.vertexvis.io',
    renderingHost: 'wss://stream.platdev.vertexvis.io',
  },
};

const platprodConfig: Config = {
  network: {
    apiHost: 'https://platform.platprod.vertexvis.io',
    renderingHost: 'wss://stream.platprod.vertexvis.io',
  },
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
  config?: string | DeepPartial<Config>
): Config {
  if (typeof config === 'string') {
    config = JSON.parse(config) as Config;
  }

  const environmentConfig = getEnvironmentConfig(environment);
  const defaultWithEnvConfig = Objects.defaults(
    environmentConfig,
    defaultConfig
  );

  if (config == null) {
    return defaultWithEnvConfig;
  } else {
    return Objects.defaults({ ...config }, defaultWithEnvConfig);
  }
}
