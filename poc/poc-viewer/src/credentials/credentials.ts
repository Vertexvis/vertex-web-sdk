import { AuthToken, Jwt } from '@vertexvis/poc-vertex-api';
import { InvalidCredentialsError } from '../errors';

export type Credentials = AuthToken.AuthToken;

export type CredentialsProvider = () => Credentials;

export function parseCredentials(
  credentials: string | Credentials | undefined
): Credentials {
  if (typeof credentials === 'string') {
    try {
      credentials = JSON.parse(credentials) as Credentials;
    } catch (e) {
      throw new InvalidCredentialsError(
        'Provided credentials string does not appear to be JSON, and can not be parsed.'
      );
    }
  }

  return credentials || AuthToken.unauthorized();
}

/**
 * Returns a promise that resolves when the token is at (or offset) from expiry.
 *
 * @param credentials
 * @param offset
 */
export async function waitForTokenExpiry(
  credentials: Credentials,
  offset = 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tokenExpirySeconds = Jwt.parseClaim(credentials, 'exp');

    if (tokenExpirySeconds == null) {
      reject('Provided token has no expiration timestamp.');
    }

    const currentTimeUtcMs = Date.now();
    const expiryTimeUtcMs = tokenExpirySeconds * 1000;
    const timeoutMs = expiryTimeUtcMs - currentTimeUtcMs - offset;

    setTimeout(resolve, timeoutMs);
  });
}

/**
 *
 */
export function credentialsAreExpired(credentials: Credentials): boolean {
  const tokenExpirySeconds = Jwt.parseClaim(credentials, 'exp');

  if (tokenExpirySeconds == null) {
    return false;
  }

  const currentTimeUtcMs = Date.now();
  const expiryTimeUtcMs = tokenExpirySeconds * 1000;

  return expiryTimeUtcMs - currentTimeUtcMs < 0;
}

export const oauth2 = AuthToken.oauth2;

export const apiKey = AuthToken.apiKey;
