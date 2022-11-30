import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';
import { toProtoDuration } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { Animation, FlyTo, FrameCamera } from '../types';
import { ItemOperation } from './operations';
import { QueryExpression } from './queries';
import { SceneViewStateFeature, SceneViewStateIdentifier } from './scene';

export interface BuildSceneOperationContext {
  dimensions: Dimensions.Dimensions;
}

export function buildSceneViewStateIdentifier(
  identifier: UUID.UUID | SceneViewStateIdentifier
):
  | Pick<
      vertexvis.protobuf.stream.ILoadSceneViewStatePayload,
      'sceneViewStateId'
    >
  | Pick<
      vertexvis.protobuf.stream.ILoadSceneViewStatePayload,
      'sceneViewStateSuppliedId'
    > {
  if (typeof identifier === 'string') {
    return { sceneViewStateId: { hex: identifier } };
  } else {
    return identifier.type === 'supplied-id'
      ? { sceneViewStateSuppliedId: { value: identifier.id } }
      : { sceneViewStateId: { hex: identifier.id } };
  }
}

export function buildSceneOperation(
  query: QueryExpression,
  operations: ItemOperation[],
  context: BuildSceneOperationContext
): vertexvis.protobuf.stream.ISceneOperation {
  const operationTypes = buildOperationTypes(operations);

  switch (query.type) {
    case 'and':
    case 'or':
      return {
        [query.type]: {
          queries: query.expressions.map((exp) => ({
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
    case 'all':
      return {
        all: {},
        operationTypes,
      };
    case 'scene-tree-range':
      return {
        sceneTreeRange: {
          start: query.range.start,
          end: query.range.end,
        },
        operationTypes,
      };
    case 'metadata':
      return {
        metadata: {
          valueFilter: query.filter,
          keys: query.keys,
          exactMatch: query.exactMatch,
        },
        operationTypes,
      };
    case 'all-selected':
      return {
        override: {
          selection: {},
        },
        operationTypes,
      };
    case 'point':
      return {
        point: {
          point: query.point,
          viewport: context.dimensions,
        },
        operationTypes,
      };
    case 'volume-intersection':
      return {
        volume: {
          frustumByRectangle: {
            rectangle: query.rectangle,
          },
          exclusive: query.exclusive,
          viewport: context.dimensions,
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

export function buildFlyToOperation(
  frameCorrelationId: UUID.UUID,
  options: FlyTo.FlyToOptions,
  animation?: Animation.Animation
): vertexvis.protobuf.stream.IFlyToPayload {
  const payload = {
    frameCorrelationId: {
      value: frameCorrelationId,
    },
    animation: animation
      ? {
          duration: toProtoDuration(animation.milliseconds),
        }
      : undefined,
  };

  switch (options.flyTo.type) {
    case 'supplied': {
      return {
        ...payload,
        itemSuppliedId: options.flyTo.data,
      };
    }
    case 'internal': {
      return {
        ...payload,
        itemId: new vertexvis.protobuf.core.Uuid({
          hex: options.flyTo.data,
        }),
      };
    }
    case 'camera': {
      return {
        ...payload,
        camera: FrameCamera.toProtobuf(options.flyTo.data),
      };
    }

    case 'bounding-box': {
      return {
        ...payload,
        boundingBox: {
          xmin: options.flyTo.data.min.x,
          xmax: options.flyTo.data.max.x,
          ymin: options.flyTo.data.min.y,
          ymax: options.flyTo.data.max.y,
          zmin: options.flyTo.data.min.z,
          zmax: options.flyTo.data.max.z,
        },
      };
    }
    default:
      return {};
  }
}

function buildOperationTypes(
  operations: ItemOperation[]
): vertexvis.protobuf.stream.IOperationType[] {
  return operations.map((op) => {
    switch (op.type) {
      case 'change-material':
        return {
          changeMaterial: {
            material: {
              d: op.material.opacity,
              ns: op.material.glossiness,
              ka: op.material.ambient,
              kd: op.material.diffuse,
              ks: op.material.specular,
              ke: op.material.emissive,
            },
          },
        };
      case 'clear-override':
        return {
          changeMaterial: {},
        };
      case 'change-transform':
        return {
          changeTransform: {
            transform: { ...op.transform },
          },
        };
      case 'clear-transform':
        return {
          clearTransform: {
            cascade: op.cascade,
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
      case 'select':
        return {
          changeSelection: {
            material: {
              d: op.material.opacity,
              ns: op.material.glossiness,
              ka: op.material.ambient,
              kd: op.material.diffuse,
              ks: op.material.specular,
              ke: op.material.emissive,
            },
          },
        };
      case 'deselect':
        return {
          changeSelection: {},
        };
      default:
        return {};
    }
  });
}

export function toPbSceneViewStateFeatures(
  features: SceneViewStateFeature[]
): vertexvis.protobuf.stream.SceneViewStateFeature[] {
  return features.map((feature) => {
    switch (feature) {
      case 'camera':
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_CAMERA;
      case 'material_overrides':
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_MATERIAL_OVERRIDE;
      case 'selection':
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_SELECTION;
      case 'visibility':
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_VISIBILITY;
      case 'transforms':
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_TRANSFORM;
      case 'cross_section':
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_CROSS_SECTION;
      default:
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_INVALID;
    }
  });
}
