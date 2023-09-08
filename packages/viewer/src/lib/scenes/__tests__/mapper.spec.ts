import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';

import { buildSceneOperation, toPbSceneViewStateFeatures } from '../mapper';

describe(buildSceneOperation, () => {
  it('maps a clear transform operation', () => {
    expect(
      buildSceneOperation(
        { type: 'all' },
        [{ type: 'clear-transform', cascade: true }],
        {
          dimensions: Dimensions.create(100, 100),
        }
      )
    ).toMatchObject({
      queryExpression: {
        operand: {
          root: {},
        },
      },
      operationTypes: [
        {
          clearTransform: {
            cascade: true,
          },
        },
      ],
    });
  });
});

describe(toPbSceneViewStateFeatures, () => {
  it('maps to SceneViewStateFeature', () => {
    expect(
      toPbSceneViewStateFeatures([
        'camera',
        'material_overrides',
        'selection',
        'visibility',
        'transforms',
        'cross_section',
        'phantom',
      ])
    ).toMatchObject([
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_CAMERA,
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_MATERIAL_OVERRIDE,
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_SELECTION,
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_VISIBILITY,
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_TRANSFORM,
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_CROSS_SECTION,
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_PHANTOM,
    ]);
  });

  it('maps to invalid when unknown feature given', () => {
    expect(toPbSceneViewStateFeatures(['Not a feature'])).toMatchObject([
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_INVALID,
    ]);
  });
});
