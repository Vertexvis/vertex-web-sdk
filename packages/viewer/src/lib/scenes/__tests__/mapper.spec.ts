import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';
import { RepresentationPredefinedId } from '@vertexvis/scene-view-protos/core/protos/representation_pb';

import { random } from '../../../testing/random';
import { buildSceneOperation, toPbSceneViewStateFeatures } from '../mapper';

describe(buildSceneOperation, () => {
  it('maps operations', () => {
    const renId = random.guid();
    const repId = random.guid();
    const renSuppliedId = random.string();

    expect(
      buildSceneOperation(
        { type: 'all' },
        [
          { type: 'clear-transform', cascade: true },
          { type: 'view-rendition-by-id', id: renId },
          { type: 'view-rendition-by-supplied-id', suppliedId: renSuppliedId },
          { type: 'view-default-rendition' },
          { type: 'clear-rendition' },
          { type: 'view-representation', id: 'empty' },
          { type: 'view-representation', id: 'entire-part' },
          { type: 'view-representation', id: repId },
          { type: 'clear-representation' },
          { type: 'clear-override' },
        ],
        { dimensions: Dimensions.create(100, 100) }
      )
    ).toMatchObject({
      queryExpression: { operand: { root: {} } },
      operationTypes: [
        { clearTransform: { cascade: true } },
        { viewRendition: { id: { hex: renId } } },
        { viewRendition: { suppliedId: renSuppliedId } },
        { viewDefaultRendition: {} },
        { clearRendition: {} },
        {
          viewRepresentation: {
            predefinedId:
              RepresentationPredefinedId.REPRESENTATION_PREDEFINED_ID_EMPTY,
          },
        },
        {
          viewRepresentation: {
            predefinedId:
              RepresentationPredefinedId.REPRESENTATION_PREDEFINED_ID_ENTIRE_PART,
          },
        },
        { viewRepresentation: { id: { hex: repId } } },
        { clearRepresentation: {} },
        { clearMaterial: {} },
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
