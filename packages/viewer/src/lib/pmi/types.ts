import { UUID } from '@vertexvis/utils';

import { PagingLinks } from '../types/pagination';

export interface PmiAnnotation {
  id: UUID.UUID;
  displayName: string;
}

export interface PmiAnnotationListResponse {
  annotations: PmiAnnotation[];
  paging: PagingLinks;
}
