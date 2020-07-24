import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';
import { Disposable, Uri, UUID } from '@vertexvis/utils';
import { UrlDescriptor } from '@vertexvis/stream-api';
import { InvalidCredentialsError } from '../errors';
import { CommandContext, Command } from './command';
import { CommandRegistry } from './commandRegistry';
import { OperationDefinition } from '../scenes/operations';
import { QueryExpression } from '../scenes/queries';

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
  operations: OperationDefinition[]
): Command<Promise<vertexvis.protobuf.stream.IStreamResponse>> {
  return ({ stream }: CommandContext) => {
    const pbOperations: vertexvis.protobuf.stream.ISceneOperation[] = [
      buildSceneOperation(query, operations),
    ];
    const request: vertexvis.protobuf.stream.ICreateSceneAlterationRequest = {
      sceneViewId: new vertexvis.protobuf.core.Uuid({
        hex: sceneViewId,
      }),
      operations: pbOperations,
    };

    return stream.createSceneAlteration(request);
  };
}

function buildSceneOperation(
  query: QueryExpression,
  operations: OperationDefinition[]
): vertexvis.protobuf.stream.ISceneOperation {
  const operationTypes: vertexvis.protobuf.stream.IOperationType[] = buildOperationTypes(
    operations
  );

  switch (query.type) {
    case 'and':
      return {
        and: buildQueryCollection(query),
        operationTypes,
      };
    case 'or':
      return {
        or: buildQueryCollection(query),
        operationTypes,
      };
    case 'item-id':
    case 'supplied-id':
      return {
        item: {
          sceneItemQuery: buildSceneItemQuery(query),
        },
        operationTypes,
      };
    default:
      return {};
  }
}

function buildSceneItemQuery(
  item: QueryExpression
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
  query: QueryExpression
): vertexvis.protobuf.stream.IQueryCollection {
  switch (query.type) {
    case 'and':
    case 'or':
      return {
        queries: query.expressions.map((expQuery: QueryExpression) => {
          return {
            sceneItemQuery: buildSceneItemQuery(expQuery),
          };
        }),
      };
    default:
      return {};
  }
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

export function registerCommands(commands: CommandRegistry): void {
  commands.register('stream.connect', connect);
  commands.register('stream.start', startStream);
  commands.register('stream.createSceneAlteration', createSceneAlteration);
}
