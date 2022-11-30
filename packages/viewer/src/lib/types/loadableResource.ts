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
  fragments: FragmentAttribute[];
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
        fragments: fromFragment(uri.fragment),
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

export interface ResourceIdTypeFragment {
  type: 'id-type';
  value: string;
}

export type FragmentAttribute = ResourceIdTypeFragment;

function fromFragment(fragment?: string): FragmentAttribute[] {
  if (fragment != null) {
    return fragment.split('&').map((fragmentComponent) => {
      const [attributeType, attributeValue] = fragmentComponent.split('=');

      switch (attributeType) {
        case 'id-type':
          return { type: 'id-type', value: attributeValue };
        default:
          throw new Error('Invalid URN. Unknown fragment attribute type');
      }
    });
  } else {
    return [];
  }
}
