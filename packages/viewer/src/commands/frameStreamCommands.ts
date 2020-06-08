import { UUID, Uri } from '@vertexvis/utils';
import { CommandContext, Command } from './command';
import { Disposable } from '../utils';
import { Dimensions } from '@vertexvis/geometry';
import { FrameResponse } from '../image-streaming-client';
import { CommandRegistry } from './commandRegistry';
import { vertexvis } from '@vertexvis/frame-stream-protos';
import { UrlDescriptor } from '../websocket-client';
import { FrameStreamingClient } from '../frame-streaming-client';
import { InvalidCredentialsError } from '../errors';

export interface ConnectOptions {
  sceneId?: string;
}

export interface LoadModelResponse {
  frameResponse: FrameResponse;
  sceneStateId: UUID.UUID;
}

export function connect({ sceneId }: ConnectOptions = {}): Command<
  Promise<Disposable>,
  FrameStreamingClient
> {
  return ({ stream, config, credentialsProvider }) => {
    const urlProvider = (): UrlDescriptor => {
      const credentials = credentialsProvider();

      if (sceneId != null && credentials.strategy === 'oauth2') {
        const uri = Uri.appendPath(
          `/scenes/${sceneId}/stream`,
          Uri.parse(config.network.renderingHost)
        );

        return {
          url: Uri.toString(uri),
          protocols: [`${credentials.token}+ws.vertexvis.com`],
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
): Command<
  Promise<vertexvis.protobuf.stream.IStreamResponse>,
  FrameStreamingClient
> {
  return ({ stream }: CommandContext<FrameStreamingClient>) => {
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
