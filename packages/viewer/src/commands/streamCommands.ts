import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';
import { Disposable, Uri, UUID } from '@vertexvis/utils';
import { UrlDescriptor } from '@vertexvis/stream-api';
import { CommandContext, Command } from './command';
import { CommandRegistry } from './commandRegistry';
import { ItemOperation } from '../scenes/operations';
import { QueryExpression } from '../scenes/queries';
import { buildSceneOperation } from './streamCommandsMapper';

export interface ConnectOptions {
  streamKey: string;
}

export function connect({
  streamKey,
}: ConnectOptions): Command<Promise<Disposable>> {
  return ({ stream, config }) => {
    const urlProvider = (): UrlDescriptor => {
      const uri = Uri.appendPath(
        `/stream-keys/${streamKey}/session`,
        Uri.parse(config.network.renderingHost)
      );

      return {
        url: Uri.toString(uri),
        protocols: ['ws.vertexvis.com'],
      };
    };

    return stream.connect(urlProvider);
  };
}

export function startStream(
  dimensions: Dimensions.Dimensions
): Command<Promise<vertexvis.protobuf.stream.IStreamResponse>> {
  return ({ stream }: CommandContext) => {
    return stream.startStream({
      width: dimensions.width,
      height: dimensions.height,
    });
  };
}

export function createSceneAlteration(
  sceneViewId: UUID.UUID,
  query: QueryExpression,
  operations: ItemOperation[]
): Command<Promise<vertexvis.protobuf.stream.IStreamResponse>> {
  return ({ stream }: CommandContext) => {
    const pbOperations = [buildSceneOperation(query, operations)];
    const request = {
      sceneViewId: {
        hex: sceneViewId,
      },
      operations: pbOperations,
    };

    return stream.createSceneAlteration(request);
  };
}

export function registerCommands(commands: CommandRegistry): void {
  commands.register('stream.connect', connect);
  commands.register('stream.start', startStream);
  commands.register('stream.createSceneAlteration', createSceneAlteration);
}
