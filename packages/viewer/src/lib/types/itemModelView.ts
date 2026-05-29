import { UUID } from '@vertexvis/utils';

export interface ItemModelView {
  modelViewId?: UUID.UUID;
  sceneItemId?: UUID.UUID;
}

export function create(data: Partial<ItemModelView> = {}): ItemModelView {
  return {
    modelViewId: data.modelViewId,
    sceneItemId: data.sceneItemId,
  };
}
