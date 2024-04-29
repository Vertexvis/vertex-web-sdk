import type {
  CalloutAnnotationData,
  CustomAnnotationData,
  SceneAnnotation,
  SceneAnnotationSet,
} from '@vertexvis/scene-view-protos/core/protos/scene_annotations_pb';
import { Mapper as M } from '@vertexvis/utils';

import { ViewerIconName } from '../../components/viewer-icon/viewer-icon';
import type {
  Annotation,
  AnnotationData,
  AnnotationSet,
} from '../annotations/annotation';
import { fromPbTimestamp, fromPbUuid2l } from './corePb';
import { fromPbVector3f } from './geometry';
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
        M.mapRequiredProp('data', (data) => {
          if (data.callout != null) {
            return fromPbCalloutAnnotationData(data.callout);
          } else if (data.customJson != null) {
            return fromPbCustomAnnotationData(data.customJson);
          } else {
            throw new Error('Undefined or unknown annotation data.');
          }
        })
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

const fromPbCalloutAnnotationData: M.Func<
  CalloutAnnotationData.AsObject,
  AnnotationData
> = M.defineMapper(
  M.read(
    M.mapRequiredProp('position', fromPbVector3f),
    M.mapProp('icon', fromPbStringValue),
    M.mapProp('primaryColor', fromPbStringValue),
    M.mapProp('accentColor', fromPbStringValue)
  ),
  ([position, icon, primaryColor, accentColor]) => ({
    type: 'callout',
    position,
    icon: icon as ViewerIconName,
    primaryColor,
    accentColor,
  })
);

const fromPbCustomAnnotationData: M.Func<
  CustomAnnotationData.AsObject,
  AnnotationData
> = M.defineMapper(
  M.read(
    M.requiredProp('type'),
    M.mapRequiredProp('jsonData', (json) => JSON.parse(json))
  ),
  ([jsonType, jsonData]) => ({ type: 'custom', jsonType, jsonData })
);
