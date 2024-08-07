import {
  Camera,
  PerspectiveCamera,
} from '@vertexvis/scene-view-protos/core/protos/camera_pb';
import { ModelView } from '@vertexvis/scene-view-protos/core/protos/model_views_pb';
import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import { ItemModelView } from '@vertexvis/scene-view-protos/sceneview/protos/domain_pb';
import {
  ListItemModelViewsResponse,
  UpdateSceneViewRequest,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { UUID } from '@vertexvis/utils';
import { FieldMask } from 'google-protobuf/google/protobuf/field_mask_pb';

import { random } from './random';
import { makeUuid2l, makeVector3 } from './sceneView';

export function makeListItemModelViewsResponse(
  modelViews: ModelView[] = [makeModelView(), makeModelView()]
): ListItemModelViewsResponse {
  const res = new ListItemModelViewsResponse();
  res.setModelViewsList(modelViews);
  return res;
}

export function makeUpdateSceneViewRequest(
  sceneViewId: UUID.UUID,
  sceneItemId?: UUID.UUID,
  modelViewId?: UUID.UUID
): UpdateSceneViewRequest {
  const req = new UpdateSceneViewRequest();

  const svUuid = UUID.toMsbLsb(sceneViewId);
  const svUuid2l = new Uuid2l();
  svUuid2l.setMsb(svUuid.msb);
  svUuid2l.setLsb(svUuid.lsb);
  req.setSceneViewId(svUuid2l);

  if (sceneItemId != null && modelViewId != null) {
    const siUuid = UUID.toMsbLsb(sceneItemId);
    const siUuid2l = new Uuid2l();
    siUuid2l.setMsb(siUuid.msb);
    siUuid2l.setLsb(siUuid.lsb);
    const mvUuid = UUID.toMsbLsb(modelViewId);
    const mvUuid2l = new Uuid2l();
    mvUuid2l.setMsb(mvUuid.msb);
    mvUuid2l.setLsb(mvUuid.lsb);
    const mv = new ItemModelView();
    mv.setSceneItemId(siUuid2l);
    mv.setModelViewId(mvUuid2l);
    req.setItemModelView(mv);
  }

  const mask = new FieldMask();
  mask.addPaths('item_model_view');
  req.setUpdateMask(mask);

  return req;
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
  const camera = new Camera();
  const perspective = new PerspectiveCamera();
  perspective.setUp(makeVector3());
  perspective.setPosition(makeVector3());
  perspective.setLookAt(makeVector3());
  modelView.setCamera(camera);
  return modelView;
}
