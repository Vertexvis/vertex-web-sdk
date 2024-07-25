import { Pager } from '@vertexvis/scene-view-protos/core/protos/paging_pb';
import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import {
  ListItemModelViewsRequest,
  ListItemModelViewsResponse,
  UpdateSceneViewRequest,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { UUID } from '@vertexvis/utils';
import { FieldMask } from 'google-protobuf/google/protobuf/field_mask_pb';

import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import { Scene } from '../scenes';
import { mapListItemModelViewsResponseOrThrow } from './mapper';
import { ModelViewListResponse } from './types';

export interface ListByItemOptions {
  cursor?: string;
  size?: number;
}

/**
 * The controller for managing the model views of a scene view.
 */
export class ModelViewController {
  public constructor(
    private client: SceneViewAPIClient,
    private jwtProvider: JwtProvider,
    private deviceIdProvider: () => string | undefined,
    private sceneProvider: () => Promise<Scene>
  ) {}

  /**
   * Fetches a page of model views for a given item. The result includes a
   * cursor that can be used to fetch the next page of results.
   *
   * @param itemId The ID of the scene item to retrieve model views for.
   * @param options Options to configure fetching of items.
   * @returns A page of model views.
   */
  public async listByItem(
    itemId: UUID.UUID,
    { cursor, size = 50 }: ListByItemOptions = {}
  ): Promise<ModelViewListResponse> {
    const res: ListItemModelViewsResponse = await requestUnary(
      async (handler) => {
        const deviceId = this.deviceIdProvider();
        const meta = await createMetadata(this.jwtProvider, deviceId);
        const req = new ListItemModelViewsRequest();

        const { msb, lsb } = UUID.toMsbLsb(itemId);
        const id = new Uuid2l();
        id.setMsb(msb);
        id.setLsb(lsb);
        req.setItemId(id);

        const page = new Pager();
        page.setLimit(size);
        if (cursor != null) {
          page.setCursor(cursor);
        }
        req.setPage(page);

        this.client.listItemModelViews(req, meta, handler);
      }
    );

    return mapListItemModelViewsResponseOrThrow(res.toObject());
  }

  /**
   * Loads the provided model view within the current scene view.
   *
   * @param modelViewId The ID of the model view to load.
   */
  public async load(modelViewId: UUID.UUID): Promise<void> {
    const scene = await this.sceneProvider();

    await requestUnary(async (handler) => {
      const deviceId = this.deviceIdProvider();
      const meta = await createMetadata(this.jwtProvider, deviceId);
      const req = new UpdateSceneViewRequest();

      const svUuid = UUID.toMsbLsb(scene.sceneViewId);
      const svUuid2l = new Uuid2l();
      svUuid2l.setMsb(svUuid.msb);
      svUuid2l.setLsb(svUuid.lsb);
      req.setModelViewId(svUuid2l);

      const mvUuid = UUID.toMsbLsb(modelViewId);
      const mvUuid2l = new Uuid2l();
      mvUuid2l.setMsb(mvUuid.msb);
      mvUuid2l.setLsb(mvUuid.lsb);
      req.setModelViewId(mvUuid2l);

      const mask = new FieldMask();
      mask.addPaths('model_view_id');
      req.setUpdateMask(mask);

      this.client.updateSceneView(req, meta, handler);
    });
  }

  /**
   * Unloads any previously loaded model view within the current scene view,
   * then performs a `reset` on the scene to return to the initial state for
   * the scene view.
   */
  public async unload(): Promise<void> {
    const scene = await this.sceneProvider();

    await requestUnary(async (handler) => {
      const deviceId = this.deviceIdProvider();
      const meta = await createMetadata(this.jwtProvider, deviceId);
      const req = new UpdateSceneViewRequest();

      const svUuid = UUID.toMsbLsb(scene.sceneViewId);
      const svUuid2l = new Uuid2l();
      svUuid2l.setMsb(svUuid.msb);
      svUuid2l.setLsb(svUuid.lsb);
      req.setModelViewId(svUuid2l);

      const mask = new FieldMask();
      mask.addPaths('model_view_id');
      req.setUpdateMask(mask);

      this.client.updateSceneView(req, meta, handler);
    });

    await scene.reset({
      includeCamera: true,
    });
  }
}
