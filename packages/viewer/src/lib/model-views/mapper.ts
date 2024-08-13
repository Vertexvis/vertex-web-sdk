import type { vertexvis } from '@vertexvis/frame-streaming-protos';
import { ModelView as PBModelView } from '@vertexvis/scene-view-protos/core/protos/model_views_pb';
import { ListItemModelViewsResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { Mapper as M, UUID } from '@vertexvis/utils';

import { fromPbUuid2l, mapCursor, toPbJsUuid2l } from '../mappers';
import { ModelView, ModelViewListResponse } from './types';

const mapModelView: M.Func<PBModelView.AsObject, ModelView> = M.defineMapper(
  M.read(
    M.mapRequiredProp('id', fromPbUuid2l),
    M.getProp('displayName'),
    M.mapRequiredProp('partRevisionId', fromPbUuid2l)
  ),
  ([id, displayName, partRevisionId]) => ({
    id,
    displayName,
    partRevisionId,
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

const mapItemModelView: M.Func<
  { modelViewId: UUID.UUID; sceneItemId: UUID.UUID },
  vertexvis.protobuf.core.IItemModelView
> = M.defineMapper(
  M.read(
    M.mapProp('modelViewId', toPbJsUuid2l),
    M.mapProp('sceneItemId', toPbJsUuid2l)
  ),
  ([modelViewId, sceneItemId]) => ({ modelViewId, sceneItemId })
);

export const mapItemModelViewOrThrow = M.ifInvalidThrow(mapItemModelView);
