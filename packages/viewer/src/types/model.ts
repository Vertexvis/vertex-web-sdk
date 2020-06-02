import { Uri } from '@vertexvis/utils';
import { parseUrnComponents } from './resource';

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

export function fromEedcUrn(urn: string): Model {
  const { uri, vertexScheme, resourceType, resourceId } = parseUrnComponents(
    urn
  );

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
