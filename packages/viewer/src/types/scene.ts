import { UUID } from '@vertexvis/utils';
import { parseUrnComponents } from './resource';

interface Scene {
  id: UUID.UUID;
}

export function fromPlatformUrn(urn: string): Scene {
  const { vertexScheme, resourceType, resourceId } = parseUrnComponents(urn);

  if (vertexScheme !== 'platform') {
    throw new Error(
      'Invalid URN. Expected URN to contain platform vertex scheme'
    );
  }

  if (resourceType === 'scene') {
    return { id: resourceId };
  } else {
    throw new Error('Invalid URN. Unknown resource type');
  }
}
