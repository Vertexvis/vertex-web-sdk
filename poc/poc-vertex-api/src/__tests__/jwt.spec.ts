import { parseClaim } from '../jwt';
import { AuthToken } from '../authToken';

describe('jwt', () => {
  describe('parseClaim', () => {
    const testJwt =
      'test.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MDUxfQ.jwt';
    const authToken: AuthToken = {
      strategy: 'oauth2',
      clientId: 'clientId',
      token: testJwt,
    };

    describe('with an AuthToken that is not Unauthorized', () => {
      it('parses the requested claim', () => {
        const expiry = parseClaim(authToken, 'exp');

        expect(expiry).toBe(15051);
      });

      describe('if the claim is not present', () => {
        it('returns undefined', () => {
          const issuer = parseClaim(authToken, 'iss');

          expect(issuer).toBeUndefined();
        });
      });
    });

    describe('with an AuthToken that is not Unauthorized, but has an improper JWT', () => {
      it('returns undefined', () => {
        const improperJwt =
          'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MDUxfQ';

        const expiry = parseClaim({ ...authToken, token: improperJwt }, 'exp');

        expect(expiry).toBeUndefined();
      });
    });

    describe('with an AuthToken that is Unauthorized', () => {
      it('returns undefined', () => {
        const authToken: AuthToken = { strategy: 'unauthorized' };

        const expiry = parseClaim(authToken, 'exp');

        expect(expiry).toBeUndefined();
      });
    });
  });
});
