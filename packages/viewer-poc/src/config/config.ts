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

const devConfig = {
  network: {
    apiHost: 'https://api.dev.vertexvis.io',
    renderingHost: 'wss://rendering.dev.vertexvis.io',
  },
};

const stagingConfig = {
  network: {
    apiHost: 'https://api.staging.vertexvis.io',
    renderingHost: 'wss://rendering.staging.vertexvis.io',
  },
};

const prodConfig = {
  network: {
    apiHost: 'https://api.prod.vertexvis.io',
    renderingHost: 'wss://rendering.prod.vertexvis.io',
  },
};

function getEnvironmentConfig(environment: Environment): Config {
  if (environment === 'dev') {
    return devConfig;
  } else if (environment === 'staging') {
    return stagingConfig;
  } else {
    return prodConfig;
  }
}

export function parseConfig(
  environment: Environment = 'dev',
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
