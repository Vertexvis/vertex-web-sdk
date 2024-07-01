import { ModelView } from '@vertexvis/scene-view-protos/core/protos/model_views_pb';
import { ListItemModelViewsResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { UUID } from '@vertexvis/utils';

import { random } from './random';
import { makeUuid2l } from './sceneView';

export function makeListItemModelViewsResponse(
  modelViews: ModelView[] = [makeModelView(), makeModelView()]
): ListItemModelViewsResponse {
  const res = new ListItemModelViewsResponse();
  res.setModelViewsList(modelViews);
  return res;
}

export function makeModelView(
  id: UUID.UUID = UUID.create(),
  partRevisionId: UUID.UUID = UUID.create(),
  displayName: string = random.string()
): ModelView {
  const modelView = new ModelView();
  modelView.setId(makeUuid2l(id));
  modelView.setPartRevisionId(makeUuid2l(partRevisionId));
  modelView.setDisplayName(displayName);
  return modelView;
}
