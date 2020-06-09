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
    renderingHost: 'wss://stream.platdev.vertexvis.io'
  },
};

function getEnvironmentConfig(environment: Environment): Config {
  return platdevConfig;
}

export function parseConfig(
  environment: Environment = 'platdev',
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
