import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';
import { RepresentationPredefinedId } from '@vertexvis/scene-view-protos/core/protos/representation_pb';
import { toProtoDuration } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import {
  Animation,
  FlyTo,
  FrameCamera,
  SceneViewStateIdentifier,
} from '../types';
import { ItemOperation } from './operations';
import { QueryExpression } from './queries';
import { SceneViewStateFeature } from './scene';

export interface BuildSceneOperationContext {
  dimensions: Dimensions.Dimensions;
}

export function buildSceneViewStateIdentifier(
  identifier: UUID.UUID | SceneViewStateIdentifier.SceneViewStateIdentifier
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
  } else if (SceneViewStateIdentifier.isSceneViewStateId(identifier)) {
    return { sceneViewStateId: { hex: identifier.id } };
  } else if (SceneViewStateIdentifier.isSceneViewStateSuppliedId(identifier)) {
    return { sceneViewStateSuppliedId: { value: identifier.suppliedId } };
  } else {
    throw new Error(
      'Unable to build scene view state identifier, input must be a string or `SceneViewStateIdentifier`.'
    );
  }
}

export function buildQueryExpression(
  query: QueryExpression,
  context: BuildSceneOperationContext
): vertexvis.protobuf.stream.IQueryExpression {
  switch (query.type) {
    case 'and':
    case 'or':
      return {
        operand: {
          itemCollection: {
            queries: query.expressions.map((exp) => ({
              sceneItemQuery: buildSceneItemQuery(exp),
            })),
          },
        },
      };
    case 'not':
      return {
        not: {
          expression: buildQueryExpression(query.query, context),
        },
      };
    case 'item-id':
    case 'supplied-id':
      return {
        operand: {
          item: {
            sceneItemQuery: buildSceneItemQuery(query),
          },
        },
      };
    case 'all':
      return {
        operand: {
          root: {},
        },
      };
    case 'scene-tree-range':
      return {
        operand: {
          sceneTreeRange: {
            start: query.range.start,
            end: query.range.end,
          },
        },
      };
    case 'metadata':
      return {
        operand: {
          metadata: {
            valueFilter: query.filter,
            keys: query.keys,
            exactMatch: query.exactMatch,
          },
        },
      };
    case 'all-selected':
      return {
        operand: {
          override: {
            selection: {},
          },
        },
      };
    case 'point':
      return {
        operand: {
          point: {
            point: query.point,
            viewport: context.dimensions,
          },
        },
      };
    case 'volume-intersection':
      return {
        operand: {
          volume: {
            frustumByRectangle: {
              rectangle: query.rectangle,
            },
            exclusive: query.exclusive,
            viewport: context.dimensions,
          },
        },
      };
    default:
      return {};
  }
}

export function buildSceneOperation(
  query: QueryExpression,
  operations: ItemOperation[],
  context: BuildSceneOperationContext
): vertexvis.protobuf.stream.ISceneOperation {
  const operationTypes = buildOperationTypes(operations);
  const queryExpression = buildQueryExpression(query, context);

  return { queryExpression, operationTypes };
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
  animation?: Animation.Animation,
  baseCamera?: FrameCamera.FrameCamera
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
    baseCamera:
      baseCamera != null ? FrameCamera.toProtobuf(baseCamera) : undefined,
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
        return { changeMaterial: {} };
      case 'change-transform':
        return { changeTransform: { transform: { ...op.transform } } };
      case 'clear-transform':
        return { clearTransform: { cascade: op.cascade } };
      case 'hide':
        return { changeVisibility: { visible: false } };
      case 'show':
        return { changeVisibility: { visible: true } };
      case 'select':
        return { changeSelection: { selected: true } };
      case 'deselect':
        return { changeSelection: { selected: false } };
      case 'change-phantom':
        return { changePhantom: { phantom: op.phantomState ?? true } };
      case 'clear-phantom':
        return { changePhantom: { phantom: false } };
      case 'change-end-item':
        return { changeEndItem: { endItem: op.endItemState ?? true } };
      case 'clear-end-item':
        return { changeEndItem: { endItem: false } };
      case 'view-rendition-by-id':
        return {
          viewRendition: {
            id: new vertexvis.protobuf.core.Uuid({ hex: op.id }),
          },
        };
      case 'view-rendition-by-supplied-id':
        return { viewRendition: { suppliedId: op.suppliedId } };
      case 'view-default-rendition':
        return { viewDefaultRendition: {} };
      case 'clear-rendition':
        return { clearRendition: {} };
      case 'view-representation':
        if (op.id === 'empty') {
          return {
            viewRepresentation: {
              predefinedId:
                RepresentationPredefinedId.REPRESENTATION_PREDEFINED_ID_EMPTY,
            },
          };
        } else if (op.id === 'entire-part') {
          return {
            viewRepresentation: {
              predefinedId:
                RepresentationPredefinedId.REPRESENTATION_PREDEFINED_ID_ENTIRE_PART,
            },
          };
        } else {
          return {
            viewRepresentation: {
              id: new vertexvis.protobuf.core.Uuid({ hex: op.id }),
            },
          };
        }
      case 'clear-representation':
        return { clearRepresentation: {} };
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
      case 'phantom':
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_PHANTOM;
      default:
        return vertexvis.protobuf.stream.SceneViewStateFeature
          .SCENE_VIEW_STATE_FEATURE_INVALID;
    }
  });
}
