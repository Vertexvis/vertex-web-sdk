import { Uri } from '@vertexvis/utils';

interface StreamKeyResource {
  type: 'stream-key';
  id: string;
}

export type LoadableResource = StreamKeyResource;

export function fromUrn(urn: string): LoadableResource {
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
      return { type: 'stream-key', id: resourceId };
    default:
      throw new Error('Invalid URN. Unknown resource type');
  }
}
