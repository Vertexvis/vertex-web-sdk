import { Disposable, Uri } from '@vertexvis/utils';
import { Command } from './command';
import { CommandRegistry } from './commandRegistry';
import { LoadableResource } from '../types';
import { InvalidCredentialsError } from '../errors';
import { Settings } from '@vertexvis/stream-api';
import { Config } from '../config/config';

export interface ConnectOptions {
  clientId?: string;
  sessionId?: string;
  resource: LoadableResource.LoadableResource;
}

export function connect({
  clientId,
  sessionId,
  resource,
}: ConnectOptions): Command<Promise<Disposable>> {
  return ({ stream, config }) => {
    if (resource.type === 'stream-key') {
      const uri = getWebsocketUri(config, resource, clientId, sessionId);

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

function getWebsocketUri(
  config: Config,
  resource: LoadableResource.LoadableResource,
  clientId?: string,
  sessionId?: string
): Uri.Uri {
  return clientId != null
    ? Uri.appendPath(
        Uri.toString(
          Uri.parseAndAddParams('/ws', {
            clientId,
            sessionId,
          })
        ),
        Uri.parse(config.network.renderingHost)
      )
    : Uri.appendPath(
        `/stream-keys/${resource.id}/session`,
        Uri.parse(config.network.renderingHost)
      );
}
