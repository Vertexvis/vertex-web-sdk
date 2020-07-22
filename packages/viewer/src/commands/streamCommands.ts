import { Uri, UUID } from '@vertexvis/utils';
import { CommandContext, Command } from './command';
import { Disposable } from '@vertexvis/utils';
import { Dimensions } from '@vertexvis/geometry';
import { CommandRegistry } from './commandRegistry';
import { UrlDescriptor } from '@vertexvis/stream-api';
import { InvalidCredentialsError } from '../errors';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import {
  ItemSelector,
  OperationDefinition,
  AnySelector,
  ChangeMaterialOperation,
} from '../scenes/operations';

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
  selector: AnySelector,
  operations: OperationDefinition[]
): Command<Promise<vertexvis.protobuf.stream.IStreamResponse>> {
  return ({ stream }: CommandContext) => {
    console.log('query in sceneAlteration: ', selector);
    console.log('operations: ', operations);
    console.log('sceneviewId in alteration: ', sceneViewId);
    console.log('The actual Item ID: ', (selector as ItemSelector).value);

    const colorOp: ChangeMaterialOperation = operations[0]
      .operation as ChangeMaterialOperation;
    const requestId: UUID.UUID = UUID.create();
    const pbOperations: vertexvis.protobuf.stream.ISceneOperation[] = [
      {
        item: {
          sceneItemQuery: {
            id: new vertexvis.protobuf.core.Uuid({
              hex: (selector as ItemSelector).value,
            }),
          },
        },
        operationTypes: [
          {
            changeMaterial: {
              material: {
                d: colorOp.color.opacity,
                ns: colorOp.color.glossiness,
                ka: colorOp.color.ambient,
                kd: colorOp.color.diffuse,
                ks: colorOp.color.specular,
                ke: colorOp.color.emissive,
              },
            },
          },
        ],
      },
    ];
    const request: vertexvis.protobuf.stream.ICreateSceneAlterationRequest = {
      sceneViewId: new vertexvis.protobuf.core.Uuid({
        hex: sceneViewId,
      }),
      operations: pbOperations,
    };

    return stream.createSceneAlteration(requestId, request);
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
