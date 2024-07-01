import { Pager } from '@vertexvis/scene-view-protos/core/protos/paging_pb';
import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import {
  ListItemModelViewsRequest,
  ListItemModelViewsResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { UUID } from '@vertexvis/utils';

import { createMetadata, JwtProvider, requestUnary } from '../grpc';

export interface ListByItemOptions {
  cursor?: string;
  size?: number;
}

/**
 * The controller for managing the annotations of a scene and scene view.
 */
export class ModelViewController {
  public constructor(
    private client: SceneViewAPIClient,
    private jwtProvider: JwtProvider,
    private deviceIdProvider: () => string | undefined
  ) {}

  /**
   * Fetches a page of model views for a given item. The result includes a
   * cursor that can be used to fetch the next page of results.
   *
   * @param itemId The ID of the scene item to retrieve model views for.
   * @param options Options to configure fetching of items.
   * @returns
   */
  public async listByItem(
    itemId: UUID.UUID,
    { cursor, size = 50 }: ListByItemOptions = {}
  ): Promise<ListItemModelViewsResponse.AsObject> {
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

    return res.toObject();
  }
}
