import { Uri } from '@vertexvis/utils';

import { InvalidResourceUrnError } from '../errors';

interface StreamKeyResource {
  type: 'stream-key';
  id: string;
}

export type LoadableResource = StreamKeyResource;

export interface Resource {
  resource: LoadableResource;
  queries: QueryResource[];
}

export function fromUrn(urn: string): Resource {
  const uri = Uri.parse(urn);

  if (uri.scheme !== 'urn' || uri.path == null) {
    throw new Error('Invalid URN. Expected URN scheme.');
  }

  const [nid, resourceType, resourceId] = uri.path.split(':');

  if (nid !== 'vertexvis') {
    throw new Error('Invalid URN. Expected URN to be vertexvis namespace');
  }

  switch (resourceType) {
    case 'stream-key':
      return {
        resource: { type: 'stream-key', id: resourceId },
        queries: fromQuery(uri.query),
      };
    default:
      throw new InvalidResourceUrnError(
        `Invalid URN. Unknown resource type ${resourceType}`
      );
  }
}

export interface SceneViewStateResource {
  type: 'scene-view-state';
  id: string;
}

export type QueryResource = SceneViewStateResource;

function fromQuery(query?: string): QueryResource[] {
  if (query != null) {
    return query.split('&').map((queryFragment) => {
      const [resourceType, resourceId] = queryFragment.split('=');

      switch (resourceType) {
        case 'scene-view-state':
          return { type: 'scene-view-state', id: resourceId };
        default:
          throw new Error('Invalid URN. Unknown query resource type');
      }
    });
  } else {
    return [];
  }
}
