import { UUID, Uri } from '@vertexvis/utils';

interface Scene {
  type: 'scene';
  id: UUID.UUID;
}

export function fromUrn(urn: string): Scene {
  const uri = Uri.parse(urn);

  if (uri.scheme !== 'urn') {
    throw new Error('Invalid URN. Expected URN scheme.');
  }

  const [nid, resourceType, resourceId] = uri.path.split(':');

  if (nid !== 'vertexvis') {
    throw new Error('Invalid URN. Expected URN to be vertexvis namespace');
  }

  if (resourceType === 'scene') {
    return { type: 'scene', id: resourceId };
  } else {
    throw new Error('Invalid URN. Unknown resource type');
  }
}
