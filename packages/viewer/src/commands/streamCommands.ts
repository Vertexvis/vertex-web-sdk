import { Disposable, Uri } from '@vertexvis/utils';
import { Command } from './command';
import { CommandRegistry } from './commandRegistry';
import { LoadableResource } from '../types';
import { InvalidCredentialsError } from '../errors';

export interface ConnectOptions {
  resource: LoadableResource.LoadableResource;
}

export function connect({
  resource,
}: ConnectOptions): Command<Promise<Disposable>> {
  return ({ stream, config }) => {
    if (resource.type === 'stream-key') {
      const params = {
        'frame-delivery.buffer-enabled':
          config.flags?.bufferFrameDelivery === true ? 'on' : 'off',
      };

      const uri = Uri.addQueryParams(
        params,
        Uri.appendPath(
          `/stream-keys/${resource.id}/session`,
          Uri.parse(config.network.renderingHost)
        )
      );

      const descriptor = {
        url: Uri.toString(uri),
        protocols: ['ws.vertexvis.com'],
      };

      return stream.connect(descriptor);
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
