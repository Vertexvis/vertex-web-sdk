import { Uri, UUID } from '@vertexvis/utils';

export interface UrnComponents {
  uri: Uri.Uri;
  nid: string;
  vertexScheme: string;
  resourceType: string;
  resourceId: UUID.UUID;
}

export function parseUrnComponents(urn: string): UrnComponents {
  const uri = Uri.parse(urn);

  if (uri.scheme !== 'urn') {
    throw new Error('Invalid URN. Expected URN scheme.');
  }

  const [nid, vertexScheme, resourceType, resourceId] = uri.path.split(':');

  if (nid !== 'vertexvis') {
    throw new Error('Invalid URN. Expected URN to be vertexvis namespace');
  }

  return {
    uri,
    nid,
    vertexScheme,
    resourceType,
    resourceId,
  };
}

export function isEedcUrn(urn: string): boolean {
  return parseUrnComponents(urn).vertexScheme === 'eedc';
}

export function isPlatformUrn(urn: string): boolean {
  return parseUrnComponents(urn).vertexScheme === 'platform';
}
