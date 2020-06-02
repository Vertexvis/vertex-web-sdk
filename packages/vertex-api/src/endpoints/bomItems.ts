import { UUID, Uri } from '@vertexvis/utils';
import { parseJson, parseResponse } from '../parser';
import { HttpClient, HttpRequest } from '@vertexvis/network';
import { BulkBomOperation, BomItem } from '../types';

interface BulkBomOperationBody {
  operations: BulkBomOperation.BulkBomOperation[];
}

interface BulkBomOperationResponse {
  sceneStateId: UUID.UUID;
  bomItems: BomItem.BomItem[];
}

export const bulkOperation = async (
  fetch: HttpClient.HttpClient,
  sceneStateId: UUID.UUID,
  body: BulkBomOperationBody
): Promise<BulkBomOperationResponse> => {
  const uri = Uri.parse(`/scene_states/${sceneStateId}/bulk_bom_items`);

  const response = await fetch(
    HttpRequest.post({
      url: Uri.toString(uri),
      body,
    })
  );

  return parseResponse(
    response,
    json => parseJson(json) as BulkBomOperationResponse
  );
};
