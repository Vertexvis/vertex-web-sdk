import { Uri } from '@vertexvis/utils';

import { CameraType } from '../../interfaces';
import { InvalidResourceUrnError } from '../errors';

interface StreamKeyResource {
  type: 'stream-key';
  id: string;
}

export type LoadableResource = StreamKeyResource;

export interface Resource {
  resource: LoadableResource;
  subResource?: PathResource;
  queries: QueryValue[];
}

export function fromUrn(urn: string): Resource {
  const uri = Uri.parse(urn);

  if (uri.scheme !== 'urn' || uri.path == null) {
    throw new Error('Invalid URN. Expected URN scheme.');
  }

  const [nid, resourceType, resourceId, ...subResourcePath] =
    uri.path.split(/[:/]/);

  if (nid !== 'vertexvis' && nid !== 'vertex') {
    throw new Error('Invalid URN. Expected URN to be vertex namespace');
  }

  if (nid === 'vertexvis') {
    console.warn(
      "vertexvis namespace is deprecated. Use 'vertex' for the namespace urn instead"
    );
  }

  switch (resourceType) {
    case 'stream-key':
      const queries = fromQuery(uri.query);
      const subResource =
        fromSubResourcePath(subResourcePath.join('/')) ??
        (queries.find((q) => q.type === 'scene-view-state') as
          | SceneViewStateResource
          | undefined);

      return {
        resource: { type: 'stream-key', id: resourceId },
        subResource,
        queries: queries.filter((q) => q.type !== 'scene-view-state'),
      };
    default:
      throw new InvalidResourceUrnError(
        `Invalid URN. Unknown resource type ${resourceType}`
      );
  }
}

export interface SceneViewStateResource {
  type: 'scene-view-state';
  id?: string;
}

export type PathResource = SceneViewStateResource;

function fromSubResourcePath(path?: string): PathResource | undefined {
  if (path != null) {
    const [subResourceType, subResourceId] = path.split('/');

    switch (subResourceType) {
      case 'scene-view-states':
        return {
          type: 'scene-view-state',
          id: subResourceId,
        };
      default:
        return undefined;
    }
  }
}

export interface SuppliedIdQueryValue {
  type: 'supplied-id';
  id: string;
}

export interface CameraTypeQueryValue {
  type: 'camera-type';
  camera: CameraType;
}

export type QueryValue =
  | SceneViewStateResource
  | SuppliedIdQueryValue
  | CameraTypeQueryValue;

function fromQuery(query?: string): QueryValue[] {
  if (query != null) {
    return query.split('&').map((queryFragment) => {
      const [resourceType, resourceId] = queryFragment.split('=');

      switch (resourceType) {
        case 'supplied-id':
          return { type: 'supplied-id', id: resourceId };
        case 'scene-view-state':
          return { type: 'scene-view-state', id: resourceId };
        case 'camera-type':
          return { type: 'camera-type', camera: resourceId as CameraType };
        default:
          throw new Error('Invalid URN. Unknown query value type');
      }
    });
  } else {
    return [];
  }
}
