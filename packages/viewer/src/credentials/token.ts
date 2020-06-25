export type Token = string | undefined;

export type TokenProvider = () => Token;

export function parseToken(token: Token): Token {
  return token?.length > 0 ? token : undefined;
}
