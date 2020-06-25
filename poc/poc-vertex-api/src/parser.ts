import { ApiException } from './types';
import { HttpResponse } from '@vertexvis/poc-network';

export type Parser<T> = (data: string) => T;

export function parseJson(json: string): object {
  return JSON.parse(json);
}

export function parseResponse<T>(
  response: HttpResponse.HttpResponse,
  parser: Parser<T>
): T {
  if (response.status >= 200 && response.status < 300) {
    return parser(response.body);
  } else {
    throw new ApiException(response);
  }
}
