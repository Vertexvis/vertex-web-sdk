import { Pager } from '@vertexvis/scene-view-protos/core/protos/paging_pb';
import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import {
  ListItemModelViewsRequest,
  ListItemModelViewsResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';
import { BoolValue } from 'google-protobuf/google/protobuf/wrappers_pb';

import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import {
  mapItemModelViewOrThrow,
  mapListItemModelViewsResponseOrThrow,
} from './mapper';
import { ModelViewListResponse } from './types';

export interface ListByItemOptions {
  hasAnnotations?: boolean;
  cursor?: string;
  size?: number;
}

/**
 * The controller for managing the model views of a scene view.
 */
export class ModelViewController {
  public constructor(
    private client: SceneViewAPIClient,
    private stream: StreamApi,
    private jwtProvider: JwtProvider,
    private deviceIdProvider: () => string | undefined
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
    { hasAnnotations, cursor, size = 50 }: ListByItemOptions = {}
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

        if (hasAnnotations != null) {
          const hasAnnotationsVal = new BoolValue();
          hasAnnotationsVal.setValue(hasAnnotations);
          req.setHasAnnotations(hasAnnotationsVal);
        }

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
   * @param sceneItemId The ID of the scene item this model view is being loaded for.
   * @param modelViewId The ID of the model view to load.
   */
  public async load(
    sceneItemId: UUID.UUID,
    modelViewId: UUID.UUID
  ): Promise<void> {
    const itemModelView = mapItemModelViewOrThrow({ modelViewId, sceneItemId });
    this.stream.updateModelView({ itemModelView }, true);
  }

  /**
   * Unloads any previously loaded model view within the current scene view,
   * then performs a `reset` on the scene to return to the initial state for
   * the scene view.
   */
  public async unload(): Promise<void> {
    this.stream.updateModelView({}, true);
  }
}
