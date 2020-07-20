import { Uri } from '@vertexvis/utils';
import { CommandContext, Command } from './command';
import { Disposable } from '@vertexvis/utils';
import { Dimensions } from '@vertexvis/geometry';
import { CommandRegistry } from './commandRegistry';
import { UrlDescriptor } from '@vertexvis/stream-api';
import { InvalidCredentialsError } from '../errors';

export interface ConnectOptions {
  sceneId?: string;
}

export function connect({ sceneId }: ConnectOptions = {}): Command<
  Promise<Disposable>
> {
  return ({ stream, config, tokenProvider: tokenProvider }) => {
    const urlProvider = (): UrlDescriptor => {
      const token = tokenProvider();

      if (sceneId != null && token != null) {
        const uri = Uri.appendPath(
          `/scenes/${sceneId}/stream`,
          Uri.parse(config.network.renderingHost)
        );

        return {
          url: Uri.toString(uri),
          protocols: [`${token}+ws.vertexvis.com`],
        };
      } else {
        throw new InvalidCredentialsError(`Provided credentials are invalid.`);
      }
    };

    return stream.connect(urlProvider);
  };
}

export function startStream(
  dimensions: Dimensions.Dimensions
): Command<Promise<void>> {
  return ({ stream }: CommandContext) => {
    console.log('startStream: ', dimensions);
    return stream.startStream({
      width: dimensions.width,
      height: dimensions.height,
    });
  };
}

export function registerCommands(commands: CommandRegistry): void {
  commands.register('stream.connect', connect);
  commands.register('stream.start', startStream);
}
