import { Disposable, Uri } from '@vertexvis/utils';
import { Command } from './command';
import { CommandRegistry } from './commandRegistry';
import { LoadableResource } from '../types';
import { InvalidCredentialsError } from '../errors';
import { Settings } from '@vertexvis/stream-api';

export interface ConnectOptions {
  resource: LoadableResource.LoadableResource;
}

export function connect({
  resource,
}: ConnectOptions): Command<Promise<Disposable>> {
  return ({ stream, config }) => {
    if (resource.type === 'stream-key') {
      // const uri = Uri.appendPath(
      //   `/stream-keys/${resource.id}/session`,
      //   Uri.parse(config.network.renderingHost)
      // );

      const uri = Uri.appendPath(
        '/ws',
        Uri.parse(config.network.renderingHost)
      );

      const descriptor = {
        url: Uri.toString(uri),
        protocols: ['ws.vertexvis.com'],
      };

      const settings: Settings = {
        EXPERIMENTAL_frameDelivery: {
          ...config.EXPERIMENTAL_frameDelivery,
          rateLimitingEnabled: config.flags.throttleFrameDelivery,
        },
        EXPERIMENTAL_adaptiveRendering: {
          ...config.EXPERIMENTAL_adaptiveRendering,
          enabled: config.flags.adaptiveRendering,
        },
        EXPERIMENTAL_qualityOfService: {
          ...config.EXPERIMENTAL_qualityOfService,
        },
      };

      return stream.connect(descriptor, settings);
    } else {
      throw new InvalidCredentialsError(
        `Cannot load resource. Invalid type ${resource.type}`
      );
    }
  };
}

export function registerCommands(commands: CommandRegistry): void {
  commands.register('stream.connect', opts => connect(opts as ConnectOptions));
}
