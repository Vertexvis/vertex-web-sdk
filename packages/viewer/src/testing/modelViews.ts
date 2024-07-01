import { ModelView } from '@vertexvis/scene-view-protos/core/protos/model_views_pb';
import { ListItemModelViewsResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { UUID } from '@vertexvis/utils';
import { createUuid2l } from './sceneView';
import { random } from './random';

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
  modelView.setId(createUuid2l(id));
  modelView.setPartRevisionId(createUuid2l(partRevisionId));
  modelView.setDisplayName(displayName);
  return modelView;
}
