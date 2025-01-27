import { PmiAnnotation as PBPmiAnnotation } from '@vertexvis/scene-view-protos/core/protos/model_views_pb';
import { ListPmiAnnotationsResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Mapper as M } from '@vertexvis/utils';

import { fromPbUuid2l, mapCursor } from '../mappers';
import { PmiAnnotation, PmiAnnotationListResponse } from './types';

const mapPmiAnnotation: M.Func<PBPmiAnnotation.AsObject, PmiAnnotation> =
  M.defineMapper(
    M.read(M.mapRequiredProp('id', fromPbUuid2l), M.getProp('displayName')),
    ([id, displayName]) => ({ id, displayName })
  );

const mapListPmiAnnotationsResponse: M.Func<
  ListPmiAnnotationsResponse.AsObject,
  PmiAnnotationListResponse
> = M.defineMapper(
  M.read(
    M.mapProp('annotationsList', M.mapArray(mapPmiAnnotation)),
    M.mapProp('nextPageCursor', mapCursor)
  ),
  ([annotations, next]) => ({ annotations, paging: { next } })
);

export const mapListPmiAnnotationsResponseOrThrow = M.ifInvalidThrow(
  mapListPmiAnnotationsResponse
);
