import {
  GetCanvasRequest,
  GetCanvasResponse,
} from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { UUID } from '@vertexvis/utils';

import { createMetadata, JwtProvider, requestUnary } from '../grpc';
import { toUuid2l } from '../mappers/uuid';
import { mapGetCanvasResponseOrThrow } from './mapper';
import { CanvasDocument } from './types';

export interface GetCanvasOptions {
  canvasId?: UUID.UUID;
  sceneViewStateId?: UUID.UUID;
}

export class CanvasController {
  public constructor(
    private client: SceneViewAPIClient,
    private jwtProvider: JwtProvider,
    private deviceIdProvider: () => string | undefined
  ) {}

  public async getCanvas({
    canvasId,
    sceneViewStateId,
  }: GetCanvasOptions): Promise<CanvasDocument> {
    if (canvasId != null && sceneViewStateId != null) {
      throw new Error(
        'Invalid request. Only one lookup ID between `canvasId` and `sceneViewStateId` can be provided.'
      );
    }

    const res: GetCanvasResponse = await requestUnary(async (handler) => {
      const deviceId = this.deviceIdProvider();
      const meta = await createMetadata(this.jwtProvider, deviceId);
      const req = new GetCanvasRequest();

      if (canvasId != null) {
        const canvasId2l = toUuid2l(canvasId);
        req.setCanvasId(canvasId2l);
      } else if (sceneViewStateId != null) {
        const sceneViewStateId2l = toUuid2l(sceneViewStateId);
        req.setSceneViewStateId(sceneViewStateId2l);
      }

      this.client.getCanvas(req, meta, handler);
    });

    return mapGetCanvasResponseOrThrow(res.toObject());
  }
}
