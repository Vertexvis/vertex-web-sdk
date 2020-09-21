import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Disposable, Uri, UUID } from '@vertexvis/utils';
import { CommandContext, Command } from './command';
import { CommandRegistry } from './commandRegistry';
import { buildSceneOperation } from './streamCommandsMapper';
import { LoadableResource } from '../types';
import { InvalidCredentialsError } from '../errors';
import { QueryOperation } from '../scenes';

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
      // const params = {};

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

/**
 * @deprecated Call StreamApi.createSceneAlteration directly.
 */
export function createSceneAlteration(
  sceneViewId: UUID.UUID,
  queryOperations: QueryOperation[]
): Command<Promise<vertexvis.protobuf.stream.IStreamResponse>> {
  return ({ stream }: CommandContext) => {
    const pbOperations = queryOperations.map(op =>
      buildSceneOperation(op.query, op.operations)
    );
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
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  //@ts-ignore
  commands.register('stream.connect', connect);
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  //@ts-ignore
  commands.register('stream.createSceneAlteration', createSceneAlteration);
}
