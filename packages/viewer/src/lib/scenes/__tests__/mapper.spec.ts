import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';
import { RepresentationPredefinedId } from '@vertexvis/scene-view-protos/core/protos/representation_pb';
import { UUID } from '@vertexvis/utils';
import Long from 'long';

import { random } from '../../../testing/random';
import {
  buildSceneElementOperationOnAnnotation,
  buildSceneElementOperationOnItem,
  toPbSceneViewStateFeatures,
} from '../mapper';

describe(buildSceneElementOperationOnItem, () => {
  it('maps operations', () => {
    const renId = random.guid();
    const repId = random.guid();
    const renSuppliedId = random.string();

    expect(
      buildSceneElementOperationOnItem(
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
      sceneItemOperation: {
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
      },
    });
  });
});

describe(buildSceneElementOperationOnAnnotation, () => {
  const annotationId1 = 'b728aa62-76c0-4b25-9196-8e5445dc1309';
  const annotationId2 = 'a276ce62-12c0-4b25-9106-8e5445ab1394';

  const { msb: annotationId1Msb, lsb: annotationId1Lsb } =
    UUID.toMsbLsb(annotationId1);
  const { msb: annotationId2Msb, lsb: annotationId2Lsb } =
    UUID.toMsbLsb(annotationId2);

  it('maps operations on all annotations', () => {
    expect(
      buildSceneElementOperationOnAnnotation(
        { type: 'all' },
        [{ type: 'hide' }, { type: 'deselect' }],
        { dimensions: Dimensions.create(100, 100) }
      )
    ).toMatchObject({
      pmiAnnotationOperation: {
        queryExpression: { operand: { all: {} } },
        operationTypes: [
          { changeVisibility: { visible: false } },
          { changeSelection: { selected: false } },
        ],
      },
    });
  });

  it('maps operations on specific annotations', () => {
    expect(
      buildSceneElementOperationOnAnnotation(
        {
          type: 'and',
          expressions: [
            { type: 'annotation-id', value: annotationId1 },
            { type: 'annotation-id', value: annotationId2 },
          ],
        },
        [{ type: 'hide' }, { type: 'deselect' }],
        { dimensions: Dimensions.create(100, 100) }
      )
    ).toMatchObject({
      pmiAnnotationOperation: {
        queryExpression: {
          and: {
            first: {
              operand: {
                annotation: {
                  id: {
                    msb: Long.fromString(annotationId1Msb),
                    lsb: Long.fromString(annotationId1Lsb),
                  },
                },
              },
            },
            second: {
              operand: {
                annotation: {
                  id: {
                    msb: Long.fromString(annotationId2Msb),
                    lsb: Long.fromString(annotationId2Lsb),
                  },
                },
              },
            },
          },
        },
        operationTypes: [
          { changeVisibility: { visible: false } },
          { changeSelection: { selected: false } },
        ],
      },
    });
  });

  it('maps operations on a single annotation when used with and query', () => {
    expect(
      buildSceneElementOperationOnAnnotation(
        {
          type: 'and',
          expressions: [{ type: 'annotation-id', value: annotationId1 }],
        },
        [{ type: 'hide' }, { type: 'deselect' }],
        { dimensions: Dimensions.create(100, 100) }
      )
    ).toMatchObject({
      pmiAnnotationOperation: {
        queryExpression: {
          operand: {
            annotation: {
              id: {
                msb: Long.fromString(annotationId1Msb),
                lsb: Long.fromString(annotationId1Lsb),
              },
            },
          },
        },
        operationTypes: [
          { changeVisibility: { visible: false } },
          { changeSelection: { selected: false } },
        ],
      },
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
