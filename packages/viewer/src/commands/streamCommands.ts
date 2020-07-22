import { Uri, UUID } from '@vertexvis/utils';
import { CommandContext, Command } from './command';
import { Disposable } from '@vertexvis/utils';
import { Dimensions } from '@vertexvis/geometry';
import { CommandRegistry } from './commandRegistry';
import { UrlDescriptor } from '@vertexvis/stream-api';
import { InvalidCredentialsError } from '../errors';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { OperationDefinition } from '../scenes/operations';
import { BuiltQuery, ItemSelector } from '../scenes/selectors';

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
  query: BuiltQuery,
  operations: OperationDefinition[],
  givenRequestId?: UUID.UUID
): Command<Promise<vertexvis.protobuf.stream.IStreamResponse>> {
  return ({ stream }: CommandContext) => {
    const requestId: UUID.UUID = givenRequestId || UUID.create();
    const pbOperations: vertexvis.protobuf.stream.ISceneOperation[] = [
      buildSceneOperation(query, operations),
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

function buildSceneOperation(
  query: BuiltQuery,
  operations: OperationDefinition[]
): vertexvis.protobuf.stream.ISceneOperation {
  const operationTypes: vertexvis.protobuf.stream.IOperationType[] = buildOperationTypes(
    operations
  );

  switch (query.selectorType) {
    case 'and-selector':
      return {
        and: buildQueryCollection(query),
        operationTypes,
      };
    case 'or-selector':
      return {
        or: buildQueryCollection(query),
        operationTypes,
      };
    case 'internal-item-selector':
      return {
        item: {
          sceneItemQuery: buildSceneItemQuery(query.query),
        },
        operationTypes,
      };
    default:
      return {};
  }
}

function buildSceneItemQuery(
  item?: ItemSelector
): vertexvis.protobuf.stream.ISceneItemQuery {
  switch (item.type) {
    case 'item-id':
      return {
        id: new vertexvis.protobuf.core.Uuid({
          hex: item.value,
        }),
      };
    case 'supplied-id':
      return {
        suppliedId: item.value,
      };
    default:
      return {};
  }
}

function buildQueryCollection(
  query: BuiltQuery
): vertexvis.protobuf.stream.IQueryCollection {
  return query.items != null
    ? {
        queries: query.items.map((query: ItemSelector) => {
          return {
            sceneItemQuery: buildSceneItemQuery(query),
          };
        }),
      }
    : {};
}

function buildOperationTypes(
  operations: OperationDefinition[]
): vertexvis.protobuf.stream.IOperationType[] {
  return operations.map(op => {
    switch (op.operation.type) {
      case 'change-material':
        return {
          changeMaterial: {
            material: {
              d: op.operation.color.opacity,
              ns: op.operation.color.glossiness,
              ka: op.operation.color.ambient,
              kd: op.operation.color.diffuse,
              ks: op.operation.color.specular,
              ke: op.operation.color.emissive,
            },
          },
        };
      case 'hide':
        return {
          changeVisibility: {
            visible: false,
          },
        };
      case 'show':
        return {
          changeVisibility: {
            visible: true,
          },
        };
      default:
        return {};
    }
  });
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
