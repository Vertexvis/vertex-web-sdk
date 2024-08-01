import { ModelView as PBModelView } from '@vertexvis/scene-view-protos/core/protos/model_views_pb';
import { ListItemModelViewsResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Mapper as M } from '@vertexvis/utils';

import { fromPbCamera, fromPbUuid2l, mapCursor } from '../mappers';
import { ModelView, ModelViewListResponse } from './types';

const mapModelView: M.Func<PBModelView.AsObject, ModelView> = M.defineMapper(
  M.read(
    M.mapRequiredProp('id', fromPbUuid2l),
    M.getProp('displayName'),
    M.mapRequiredProp('partRevisionId', fromPbUuid2l),
    M.mapRequiredProp('camera', fromPbCamera)
  ),
  ([id, displayName, partRevisionId, camera]) => ({
    id,
    displayName,
    partRevisionId,
    camera,
  })
);

const mapListItemModelViewsResponse: M.Func<
  ListItemModelViewsResponse.AsObject,
  ModelViewListResponse
> = M.defineMapper(
  M.read(
    M.mapProp('modelViewsList', M.mapArray(mapModelView)),
    M.mapProp('nextPageCursor', mapCursor)
  ),
  ([modelViews, next]) => ({ modelViews, paging: { next } })
);

export const mapListItemModelViewsResponseOrThrow = M.ifInvalidThrow(
  mapListItemModelViewsResponse
);
