import type {
  SceneAnnotation,
  SceneAnnotationSet,
} from '@vertexvis/scene-view-protos/core/protos/scene_annotations_pb';
import { Mapper as M } from '@vertexvis/utils';

import type { Annotation, AnnotationSet } from '../annotations/annotation';
import { fromPbTimestamp, fromPbUuid2l } from './corePb';
import { fromPbStringValue } from './scalar';

export const fromPbAnnotationSet: M.Func<SceneAnnotationSet, AnnotationSet> =
  M.defineMapper(
    M.compose(
      (input) => input.toObject(),
      M.read(
        M.mapRequiredProp('id', fromPbUuid2l),
        M.mapRequiredProp('createdAt', fromPbTimestamp),
        M.mapRequiredProp('modifiedAt', fromPbTimestamp),
        M.mapProp('name', fromPbStringValue),
        M.mapProp('suppliedId', fromPbStringValue)
      )
    ),
    ([id, createdAt, modifiedAt, name, suppliedId]) => ({
      id,
      createdAt,
      modifiedAt,
      name,
      suppliedId,
    })
  );

export const fromPbAnnotationSetOrThrow = M.ifInvalidThrow(fromPbAnnotationSet);

export const fromPbAnnotation: M.Func<SceneAnnotation, Annotation> =
  M.defineMapper(
    M.compose(
      (input) => input.toObject(),
      M.read(
        M.mapRequiredProp('id', fromPbUuid2l),
        M.mapRequiredProp('createdAt', fromPbTimestamp),
        M.mapRequiredProp('modifiedAt', fromPbTimestamp),
        M.mapProp('suppliedId', fromPbStringValue),
        M.mapRequiredProp('data', (data) => JSON.parse(data.json))
      )
    ),
    ([id, createdAt, modifiedAt, suppliedId, data]) => ({
      id,
      createdAt,
      modifiedAt,
      suppliedId,
      data,
    })
  );

export const fromPbAnnotationOrThrow = M.ifInvalidThrow(fromPbAnnotation);
