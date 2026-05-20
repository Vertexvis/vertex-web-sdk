import { UUID } from '@vertexvis/utils';

import { FrameCamera } from '../types';
import { PagingLinks } from '../types/pagination';

export interface ModelView {
  id: UUID.UUID;
  displayName: string;
  partRevisionId: UUID.UUID;
  camera: FrameCamera.FrameCamera;
}

export interface ModelViewListResponse {
  modelViews: ModelView[];
  paging: PagingLinks;
}
