import * as Sort from './sort';

/**
 * A type that represents a Uniform Resource Identifier (URI).
 */
export interface Uri {
  scheme?: string;
  authority?: string;
  path?: string;
  query?: string;
  fragment?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type QueryMap = Record<string, string>;
type QueryEntry = [string, string];

/**
 * Parses a URI string according to RFC 3986. If the URI is an empty string,
 * then an empty object is returned.
 *
 * See https://tools.ietf.org/html/rfc3986#appendix-B for parsing rules.
 *
 * @param uri The URI to parse.
 */
export const parse = (uri: string): Uri => {
  const regex = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
  const match = regex.exec(uri);
  if (match != null) {
    return {
      scheme: match[2],
      authority: match[4],
      path: match[5],
      query: match[7],
      fragment: match[9],
    };
  } else {
    return {};
  }
};

/**
 * Convenience method to create a URI from a base string and add params if present
 * @param base
 * @param params
 */
export const parseAndAddParams = (
  baseStr: string,
  params?: Record<string, unknown>
): Uri => {
  const base = parse(baseStr);
  return params ? addQueryParams(params, base) : base;
};

export const isEqual = (a: Uri, b: Uri): boolean => {
  const queryA = JSON.stringify(sortByQueryName(queryAsArray(a)));
  const queryB = JSON.stringify(sortByQueryName(queryAsArray(b)));
  return (
    a.scheme === b.scheme &&
    a.authority === b.authority &&
    a.path === b.path &&
    a.fragment === b.fragment &&
    queryA === queryB
  );
};

export const replacePath = (path: string, uri: Uri): Uri => {
  const pathWithForwardSlash = path[0] === '/' ? path : `/${path}`;
  return { ...uri, path: pathWithForwardSlash };
};

export const pathAsArray = (uri: Uri): string[] => {
  return uri.path != null ? sanitizePath(uri.path.split('/')) : [];
};

export const appendPath = (path: string, uri: Uri): Uri => {
  const beforeParts = pathAsArray(uri);
  const afterParts = sanitizePath(path.split('/'));
  return replacePath(beforeParts.concat(afterParts).join('/'), uri);
};

export const addQueryString = (query: string, uri: Uri): Uri => {
  const queryArray = stringAsQueryArray(query);
  return addQueryEntries(queryArray, uri);
};

export const addQueryEntry = (query: QueryEntry, uri: Uri): Uri => {
  if (query[1] != null) {
    const newQuery = [...queryAsArray(uri), query];
    return {
      ...uri,
      query: newQuery
        .map(entry => entry.map(encodeURIComponent).join('='))
        .join('&'),
    };
  } else {
    return uri;
  }
};

export const addQueryEntries = (entries: QueryEntry[], uri: Uri): Uri => {
  return entries.reduce((result, entry) => addQueryEntry(entry, result), uri);
};

export const addQueryParams = (params: Record<string, any>, uri: Uri): Uri => {
  return mapAsEntries(params).reduce(
    (result, entry) => addQueryEntry(entry, result),
    uri
  );
};

export const replaceFragment = (fragment: string, uri: Uri): Uri => {
  return { ...uri, fragment };
};

/**
 * Return an array of name/value pairs representing the query string of a URI.
 * The returned names and values will be URI decoded. If the query string is
 * empty, then an empty array is returned.
 *
 * @param uri A URI to return the query string for.
 */
export const queryAsArray = (uri: Uri): QueryEntry[] => {
  if (uri.query != null) {
    return stringAsQueryArray(uri.query);
  } else {
    return [];
  }
};

const stringAsQueryArray = (queryString: string): QueryEntry[] => {
  return queryString
    .split('&')
    .map(param =>
      param.split('=').map(value => decodeURIComponent(value))
    ) as QueryEntry[];
};

/**
 * Return a map containing a URI's query string names and their values. The
 * returned names and values will be URI decoded. If the query string contains
 * multiple instances of the same name, then the last occurrence will be used.
 *
 * If the query string is empty, an empty map is returned.
 *
 * @param uri A URI to return the query string for.
 */
export const queryAsMap = (uri: Uri): QueryMap => {
  return queryAsArray(uri).reduce((map, [name, value]) => {
    return { ...map, [name]: value };
  }, {});
};

export const toString = (uri: Uri): string => {
  let result = '';

  if (uri.scheme != null && uri.scheme.length > 0) {
    result = `${uri.scheme}:`;
  }

  if (uri.authority != null && uri.authority.length > 0) {
    result += `//${uri.authority}`;
  }

  result += uri.path;

  if (uri.query != null && uri.query.length > 0) {
    result += `?${uri.query}`;
  }

  if (uri.fragment != null && uri.fragment.length > 0) {
    result += `#${uri.fragment}`;
  }

  return result;
};

const sanitizePath = (path: string[]): string[] => {
  return path.filter(segment => segment.length > 0);
};

const mapAsEntries = (map: Record<string, any>): QueryEntry[] => {
  const entries: QueryEntry[] = [];
  for (const key in map) {
    entries.push([key, map[key]]);
  }
  return entries;
};

const sortByQueryName = (entries: QueryEntry[]): QueryEntry[] => {
  return entries.concat().sort(Sort.head(Sort.asc));
};

/* eslint-enable @typescript-eslint/no-explicit-any */
