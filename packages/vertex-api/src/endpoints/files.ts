import { HttpClient, HttpRequest } from '@vertexvis/network';
import { Uri } from '@vertexvis/utils';
import { parseResponse, parseJson } from '../parser';
import { File } from '../types/file';

interface GetFileParams {
  externalId: string;
}

export async function getFile(
  fetch: HttpClient.HttpClient,
  params: GetFileParams
): Promise<File> {
  const uri = Uri.addQueryParams(
    // eslint-disable-next-line @typescript-eslint/camelcase
    { external_id: params.externalId },
    Uri.parse(`/filestore/file`)
  );

  const response = await fetch(HttpRequest.get({ url: Uri.toString(uri) }));
  return parseResponse(response, json => parseJson(json) as File);
}
