import * as AuthToken from '../authToken';

describe(AuthToken.appendToHeaders, () => {
  it('adds Authorization header for bearer tokens', () => {
    const token = AuthToken.bearerToken('bearer-token');
    expect(AuthToken.appendToHeaders({}, token)).toEqual({
      Authorization: 'Bearer bearer-token',
    });
  });

  it('adds X-Api-Key header for api-key tokens', () => {
    const token = AuthToken.apiKey('api-token');
    expect(AuthToken.appendToHeaders({}, token)).toEqual({
      'X-Api-Key': 'api-token',
    });
  });

  it('adds X-Api-Key and Authorization header for oauth2 tokens', () => {
    const token = AuthToken.oauth2('client-id', 'access-token');
    expect(AuthToken.appendToHeaders({}, token)).toEqual({
      'X-Api-Key': 'client-id',
      Authorization: 'Bearer access-token',
    });
  });

  it('adds no headers for unauthorized token', () => {
    const token = AuthToken.unauthorized();
    expect(AuthToken.appendToHeaders({}, token)).toEqual({});
  });
});
