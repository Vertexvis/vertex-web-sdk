import { Pager } from '@vertexvis/scene-tree-protos/core/protos/paging_pb';
import { Uuid2l } from '@vertexvis/scene-tree-protos/core/protos/uuid_pb';
import {
  ListSceneItemMetadataRequest,
  ListSceneItemMetadataResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { UUID } from '@vertexvis/utils';

import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import { mapListSceneItemMetadataResponseOrThrow } from './mapper';
import {
  ListSceneItemMetadataOptions,
  SceneItemMetadataResponse,
} from './types';

export class SceneItemController {
  public constructor(
    private readonly client: SceneViewAPIClient,
    private readonly jwtProvider: JwtProvider,
    private readonly deviceIdProvider: () => string | undefined
  ) {}

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
