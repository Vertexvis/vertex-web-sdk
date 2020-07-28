import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { ItemOperation } from '../scenes/operations';
import { QueryExpression } from '../scenes/queries';

// export function buildSceneOperation(
//   query: QueryExpression,
//   operations: ItemOperation[]
// ): vertexvis.protobuf.stream.ISceneOperation {
//   const operationTypes: vertexvis.protobuf.stream.IOperationType[] = buildOperationTypes(
//     operations
//   );

//   switch (query.type) {
//     case 'and':
//       return {
//         and: buildQueryCollection(query),
//         operationTypes,
//       };
//     case 'or':
//       return {
//         or: buildQueryCollection(query),
//         operationTypes,
//       };
//     case 'item-id':
//     case 'supplied-id':
//       return {
//         item: {
//           sceneItemQuery: buildSceneItemQuery(query),
//         },
//         operationTypes,
//       };
//     default:
//       return {};
//   }
// }
export function buildSceneOperation(
  query: QueryExpression,
  operations: ItemOperation[]
): vertexvis.protobuf.stream.ISceneOperation {
  const operationTypes = buildOperationTypes(operations);

  switch (query.type) {
    case 'and':
    case 'or':
      return {
        [query.type]: {
          queries: query.expressions.map(exp => ({
            sceneItemQuery: buildSceneItemQuery(exp),
          })),
        },
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

function buildOperationTypes(
  operations: ItemOperation[]
): vertexvis.protobuf.stream.IOperationType[] {
  return operations.map(op => {
    switch (op.type) {
      case 'change-material':
        return {
          changeMaterial: {
            material: {
              d: op.color.opacity,
              ns: op.color.glossiness,
              ka: op.color.ambient,
              kd: op.color.diffuse,
              ks: op.color.specular,
              ke: op.color.emissive,
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
