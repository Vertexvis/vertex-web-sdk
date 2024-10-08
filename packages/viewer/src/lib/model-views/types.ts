import { UUID } from '@vertexvis/utils';

import { PagingLinks } from '../types/pagination';

export interface ModelView {
  id: UUID.UUID;
  displayName: string;
  partRevisionId: UUID.UUID;
}

export interface ModelViewListResponse {
  modelViews: ModelView[];
  paging: PagingLinks;
}
