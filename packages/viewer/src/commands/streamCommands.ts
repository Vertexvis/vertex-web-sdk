import { Uri, UUID } from '@vertexvis/utils';
import { CommandContext, Command } from './command';
import { Disposable } from '@vertexvis/utils';
import { Dimensions } from '@vertexvis/geometry';
import { CommandRegistry } from './commandRegistry';
import { UrlDescriptor } from '@vertexvis/stream-api';
import { InvalidCredentialsError } from '../errors';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { ItemSelector, OperationDefinition } from '../scenes/operations';

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

export function createSceneAlteration(
  sceneViewId: UUID.UUID,
  query: ItemSelector,
  operations: OperationDefinition[]
): Command<Promise<vertexvis.protobuf.stream.IStreamResponse>> {
  return ({ stream }: CommandContext) => {
    console.log('query in sceneAlteration: ', query);
    console.log('operations: ', operations);
    const requestId: UUID.UUID = UUID.create();
    return stream.createSceneAlteration(requestId, {
      sceneViewId: new vertexvis.protobuf.core.Uuid({
        hex: sceneViewId,
      }),
      operations: [], // todo madison need to map these operations to proto
    });
  };
}

export function startStream(
  dimensions: Dimensions.Dimensions
): Command<Promise<vertexvis.protobuf.stream.IStreamResponse>> {
  return async ({ stream }: CommandContext) => {
    const startStream = await stream.startStream({
      width: dimensions.width,
      height: dimensions.height,
    });
    return Promise.resolve(startStream);
  };
}

export function registerCommands(commands: CommandRegistry): void {
  commands.register('stream.connect', connect);
  commands.register('stream.start', startStream);
  commands.register('stream.createSceneAlteration', createSceneAlteration);
}
