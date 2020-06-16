import { Uri } from '@vertexvis/utils';

interface FileModel {
  type: 'file';
  fileId?: string;
  externalFileId?: string;
}

interface SceneStateModel {
  type: 'scenestate';
  sceneStateId: string;
}

export type Model = SceneStateModel | FileModel;

export function fromUrn(urn: string): Model {
  const uri = Uri.parse(urn);

  if (uri.scheme !== 'urn') {
    throw new Error('Invalid URN. Expected URN scheme.');
  }

  const [nid, vertexScheme, resourceType, resourceId] = uri.path.split(':');

  if (nid !== 'vertexvis') {
    throw new Error('Invalid URN. Expected URN to be vertexvis namespace');
  }

  if (vertexScheme !== 'eedc') {
    throw new Error('Invalid URN. Expected URN to contain eedc vertex scheme');
  }

  if (resourceType === 'scenestate') {
    return { type: 'scenestate', sceneStateId: resourceId };
  } else if (resourceType === 'file') {
    const params = Uri.queryAsMap(uri);
    return {
      type: 'file',
      fileId: resourceId,
      externalFileId: params['externalId'],
    };
  } else {
    throw new Error('Invalid URN. Unknown resource type');
  }
}
