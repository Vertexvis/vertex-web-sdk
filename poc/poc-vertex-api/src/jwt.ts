import { UUID } from '@vertexvis/utils';
import { AuthToken } from '.';

export interface VertexJwt {
  // Issued at timestamp in seconds
  iat: number;
  // Expiration timestamp in seconds
  exp: number;
  // Issuer of this JWT
  iss: string;
  orgId: UUID.UUID;
}

export enum VertexJwtClaim {
  IssuedAt = 'iat',
  Expiration = 'exp',
  Issuer = 'iss',
  OrganizationId = 'orgId',
}

export function parseClaim<K extends keyof VertexJwt>(
  token: AuthToken.AuthToken,
  claim: K
): VertexJwt[K] | undefined {
  if (token.strategy !== 'unauthorized') {
    const claims = getJwtClaims(token.token);

    if (claims != null) {
      return claims[claim];
    }
  }
}

function getJwtClaims(token: string): VertexJwt | undefined {
  const tokenParts = token.split('.');

  if (tokenParts.length === 3) {
    return JSON.parse(atob(tokenParts[1])) as VertexJwt;
  }
}
