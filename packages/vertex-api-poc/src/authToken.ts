import { HttpHeaders } from '@vertexvis/network';

interface BearerToken {
  strategy: 'bearer';
  token: string;
}

interface ApiKey {
  strategy: 'api-key';
  token: string;
}

interface Oauth2 {
  strategy: 'oauth2';
  clientId: string;
  token: string;
}

interface Unauthorized {
  strategy: 'unauthorized';
}

export type AuthToken = BearerToken | ApiKey | Oauth2 | Unauthorized;

export function bearerToken(token: string): AuthToken {
  return {
    strategy: 'bearer',
    token,
  };
}

export function apiKey(token: string): AuthToken {
  return {
    strategy: 'api-key',
    token,
  };
}

export function oauth2(clientId: string, token: string): AuthToken {
  return {
    strategy: 'oauth2',
    clientId,
    token,
  };
}

export function unauthorized(): AuthToken {
  return {
    strategy: 'unauthorized',
  };
}

export function appendToHeaders(
  headers: HttpHeaders.HttpHeaders,
  authToken: AuthToken
): HttpHeaders.HttpHeaders {
  if (authToken != null && authToken.strategy === 'bearer') {
    return { Authorization: `Bearer ${authToken.token}`, ...headers };
  } else if (authToken != null && authToken.strategy === 'api-key') {
    return { 'X-Api-Key': authToken.token, ...headers };
  } else if (authToken != null && authToken.strategy === 'oauth2') {
    return {
      'X-Api-Key': authToken.clientId,
      Authorization: `Bearer ${authToken.token}`,
      ...headers,
    };
  } else {
    return headers;
  }
}
