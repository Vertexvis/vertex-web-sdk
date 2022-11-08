import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';

import { buildSceneOperation, toPbSceneViewStateFacets } from '../mapper';

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
      all: {},
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
      toPbSceneViewStateFacets(['camera', 'material_override'])
    ).toMatchObject([
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_CAMERA,
      vertexvis.protobuf.stream.SceneViewStateFeature
        .SCENE_VIEW_STATE_FEATURE_MATERIAL_OVERRIDE,
    ]);
  });
});
