import { Pager } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { Uuid2l } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import {
  GetSceneViewItemRequest,
  GetSceneViewItemResponse,
  ListSceneItemMetadataRequest,
  ListSceneItemMetadataResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { UUID } from '@vertexvis/utils';
import { FieldMask } from 'google-protobuf/google/protobuf/field_mask_pb';

import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import {
  mapGetSceneViewItemResponseOrThrow,
  mapListSceneItemMetadataResponseOrThrow,
} from './mapper';
import {
  GetSceneViewItemOptions,
  ListSceneItemMetadataOptions,
  SceneItemMetadataResponse,
  SceneViewItem,
} from './types';

export class SceneItemController {
  public constructor(
    private readonly client: SceneViewAPIClient,
    private readonly jwtProvider: JwtProvider,
    private readonly deviceIdProvider: () => string | undefined
  ) {}

  public async getSceneViewItem(
    itemId: UUID.UUID,
    viewId: UUID.UUID,
    getOptions: GetSceneViewItemOptions
  ): Promise<SceneViewItem | undefined> {
    const res: GetSceneViewItemResponse = await requestUnary(
      async (handler) => {
        const deviceId = this.deviceIdProvider();
        const meta = await createMetadata(this.jwtProvider, deviceId);
        const req = new GetSceneViewItemRequest();

        // Set scene item id
        const { msb: itemMsb, lsb: itemLsb } = UUID.toMsbLsb(itemId);
        const itemId2l = new Uuid2l();
        itemId2l.setMsb(itemMsb);
        itemId2l.setLsb(itemLsb);
        req.setSceneItemId(itemId2l);

        // Set scene view id
        const { msb: viewMsb, lsb: viewLsb } = UUID.toMsbLsb(viewId);
        const viewId2l = new Uuid2l();
        viewId2l.setMsb(viewMsb);
        viewId2l.setLsb(viewLsb);
        req.setViewId(viewId2l);

        const additionalFields = new FieldMask();

        if (getOptions.includeBoundingBox) {
          additionalFields.addPaths('bounding_box');
        }
        if (getOptions.includeWorldTransform) {
          additionalFields.addPaths('world_transform');
        }
        if (getOptions.includeMaterialOverride) {
          additionalFields.addPaths('override');
        }

        req.setAdditionalFields(additionalFields);

        this.client.getSceneViewItem(req, meta, handler);
      }
    );
    return mapGetSceneViewItemResponseOrThrow(res.toObject());
  }

  public async listSceneItemMetadata(
    itemId: UUID.UUID,
    listByOptions: ListSceneItemMetadataOptions
  ): Promise<SceneItemMetadataResponse> {
    const res: ListSceneItemMetadataResponse = await requestUnary(
      async (handler) => {
        const deviceId = this.deviceIdProvider();
        const meta = await createMetadata(this.jwtProvider, deviceId);
        const req = new ListSceneItemMetadataRequest();

        const { msb, lsb } = UUID.toMsbLsb(itemId);
        const id = new Uuid2l();
        id.setMsb(msb);
        id.setLsb(lsb);
        req.setItemId(id);

        const pager = new Pager();
        if (listByOptions.size != null) {
          pager.setLimit(listByOptions.size);
        }
        if (listByOptions.cursor != null) {
          pager.setCursor(listByOptions.cursor);
        }
        req.setPager(pager);

        this.client.listSceneItemMetadata(req, meta, handler);
      }
    );
    return mapListSceneItemMetadataResponseOrThrow(res.toObject());
  }
}
