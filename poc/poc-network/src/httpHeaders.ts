import { Objects, Strings } from '@vertexvis/utils';

export type HttpHeaders = Record<string, string>;

type Entry = [string, string];

export function toEntries(headers: HttpHeaders): Entry[] {
  return Objects.toPairs(headers);
}

export function addToXmlHttpRequest(
  req: XMLHttpRequest,
  headers: HttpHeaders
): XMLHttpRequest {
  const entries = toEntries(headers);
  entries.forEach(([name, value]) => req.setRequestHeader(name, value));
  return req;
}

export function fromXhr(request: XMLHttpRequest): HttpHeaders {
  const headers = request.getAllResponseHeaders();
  if (headers != null) {
    const entries = headers
      .split('\r\n')
      .map(header => header.split(':').map(Strings.trim)) as Entry[];
    return fromEntries(entries);
  }
  return {};
}

function fromEntries(entries: Entry[]): HttpHeaders {
  return entries.reduce(
    (headers, [key, value]) => ({ ...headers, [key]: value }),
    {}
  );
}
