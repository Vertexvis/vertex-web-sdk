import { Objects, DeepPartial } from '@vertexvis/utils';
import { Environment } from './environment';

type StreamingClient = 'eedc' | 'platform';

interface NetworkConfig {
  apiHost: string;
  renderingHost: string;
  streamingClient: StreamingClient;
}

export interface Config {
  network: NetworkConfig;
}

export type ConfigProvider = () => Config;

export const defaultConfig: DeepPartial<Config> = {};

const devConfig: Config = {
  network: {
    apiHost: 'https://api.dev.vertexvis.io',
    renderingHost: 'wss://rendering.dev.vertexvis.io',
    streamingClient: 'eedc',
  },
};

const stagingConfig: Config = {
  network: {
    apiHost: 'https://api.staging.vertexvis.io',
    renderingHost: 'wss://rendering.staging.vertexvis.io',
    streamingClient: 'eedc',
  },
};

const platdevConfig: Config = {
  network: {
    apiHost: 'https://platform.platdev.vertexvis.io',
    renderingHost: 'wss://stream.platdev.vertexvis.io',
    streamingClient: 'platform',
  },
};

const prodConfig: Config = {
  network: {
    apiHost: 'https://api.prod.vertexvis.io',
    renderingHost: 'wss://rendering.prod.vertexvis.io',
    streamingClient: 'eedc',
  },
};

function getEnvironmentConfig(environment: Environment): Config {
  if (environment === 'dev') {
    return devConfig;
  } else if (environment === 'staging') {
    return stagingConfig;
  } else if (environment === 'platdev') {
    return platdevConfig;
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
