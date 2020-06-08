import { HttpClient, HttpRequest } from '@vertexvis/network';
import { UUID, Uri } from '@vertexvis/utils';
import { SceneState, BulkBomOperation } from '../types';
import { parseResponse, parseJson } from '../parser';

interface CreateSceneStateRequest {
  urn: string;
  operations: BulkBomOperation.BulkBomOperation[];
}

interface CreateSceneStateResponse {
  sceneStateId: UUID.UUID;
}

export async function create(
  fetch: HttpClient.HttpClient,
  body: CreateSceneStateRequest
): Promise<CreateSceneStateResponse> {
  const uri = Uri.parse(`/scene_states`);
  const response = await fetch(
    HttpRequest.post({
      url: Uri.toString(uri),
      body: { id: body.urn, operations: body.operations },
    })
  );
  return parseResponse(
    response,
    json => parseJson(json) as CreateSceneStateResponse
  );
}

export async function clone(
  fetch: HttpClient.HttpClient,
  sceneStateId: UUID.UUID,
  reduce = false
): Promise<SceneState.SceneState> {
  const uri = Uri.addQueryParams(
    { cloneReduced: reduce },
    Uri.parse(`/scene_states/${sceneStateId}/clone`)
  );

  const response = await fetch(HttpRequest.post({ url: Uri.toString(uri) }));
  return parseResponse(
    response,
    json => parseJson(json) as SceneState.SceneState
  );
}

export async function getForUserAndFile(
  fetch: HttpClient.HttpClient,
  fileId: UUID.UUID
): Promise<SceneState.SceneState> {
  const uri = Uri.addQueryParams(
    {
      fileId,
    },
    Uri.parse('/scene_states')
  );
  const response = await fetch(HttpRequest.get({ url: Uri.toString(uri) }));
  return parseResponse(
    response,
    json => parseJson(json) as SceneState.SceneState
  );
}
