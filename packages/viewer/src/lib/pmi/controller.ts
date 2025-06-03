import { Pager } from '@vertexvis/scene-view-protos/core/protos/paging_pb';
import {
  ListPmiAnnotationsRequest,
  ListPmiAnnotationsResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { UUID } from '@vertexvis/utils';

import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import { toUuid2l } from '../mappers/uuid';
import { mapListPmiAnnotationsResponseOrThrow } from './mapper';
import { PmiAnnotationListResponse } from './types';

export interface ListAnnotationsOptions {
  modelViewId?: UUID.UUID;
  cursor?: string;
  size?: number;
}

export class PmiController {
  public constructor(
    private client: SceneViewAPIClient,
    private jwtProvider: JwtProvider,
    private deviceIdProvider: () => string | undefined
  ) {}

  public async listAnnotations({
    modelViewId,
    cursor,
    size = 50,
  }: ListAnnotationsOptions = {}): Promise<PmiAnnotationListResponse> {
    const res: ListPmiAnnotationsResponse = await requestUnary(
      async (handler) => {
        const deviceId = this.deviceIdProvider();
        const meta = await createMetadata(this.jwtProvider, deviceId);
        const req = new ListPmiAnnotationsRequest();

        if (modelViewId != null) {
          const modelViewId2l = toUuid2l(modelViewId);
          req.setModelViewId(modelViewId2l);
        }

        const page = new Pager();
        page.setLimit(size);
        if (cursor != null) {
          page.setCursor(cursor);
        }
        req.setPage(page);

        this.client.listPmiAnnotations(req, meta, handler);
      }
    );

    return mapListPmiAnnotationsResponseOrThrow(res.toObject());
  }
}
