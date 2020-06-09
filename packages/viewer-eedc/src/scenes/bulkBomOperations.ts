import { BomItemQuery, BulkBomOperation } from '@vertexvis/vertex-api';
import {
  ItemOperation,
  OperationDefinition,
  SceneOperation,
} from './operations';
import { ItemSelector, PositionSelector } from './selectors';

function createBomOperationFromOperation(
  operation: SceneOperation | ItemOperation
): BulkBomOperation.BomOperation {
  if (operation.type === 'highlight') {
    return {
      type: operation.type,
      hexColorString: operation.color,
    };
  } else {
    return { type: operation.type };
  }
}

export function createBomItemQuery(
  selector: ItemSelector | PositionSelector | undefined
): BomItemQuery.BomItemQuery {
  if (selector == null) {
    return { bomItemQueryType: BomItemQuery.BomItemQueryType.NONE, value: '' };
  } else if (selector.type === 'metadata') {
    return {
      bomItemQueryType: BomItemQuery.BomItemQueryType.METADATA,
      key: selector.key,
      value: selector.value,
    };
  } else if (selector.type === 'item-id') {
    return {
      bomItemQueryType: BomItemQuery.BomItemQueryType.PART_ID,
      value: selector.value,
    };
  } else if (selector.type === 'position') {
    return {
      bomItemQueryType: BomItemQuery.RestBomItemQueryType.POSITION,
      hitRequestBody: selector.hitRequestBody,
    };
  }
}

export function createBulkBomOperationFromDefinition(
  definition: OperationDefinition
): BulkBomOperation.BulkBomOperation[] {
  if (definition.selector?.type === 'or') {
    return definition.selector.selectors.reduce(
      (results, selector) => [
        ...results,
        ...createBulkBomOperationFromDefinition({
          selector,
          operation: definition.operation,
        }),
      ],
      []
    );
  } else {
    return [
      {
        bomItemQuery: createBomItemQuery(definition.selector),
        bomOperations: [createBomOperationFromOperation(definition.operation)],
      },
    ];
  }
}

export function dedupBulkBomOperations(
  operations: BulkBomOperation.BulkBomOperation[]
): BulkBomOperation.BulkBomOperation[] {
  const operationMap = operations.reduce((result, op) => {
    const queryTag = JSON.stringify(op.bomItemQuery);

    return {
      ...result,
      [queryTag]:
        result[queryTag] != null
          ? [...result[queryTag], ...op.bomOperations]
          : [...op.bomOperations],
    };
  }, {});

  return Object.keys(operationMap).map(key => ({
    bomItemQuery: JSON.parse(key),
    bomOperations: operationMap[key],
  }));
}
