import jwtDecode, { JwtPayload } from 'jwt-decode';

export interface SceneTreeJwtToken extends JwtPayload {
  view: string;
}

export function decodeSceneTreeJwt(jwt: string): SceneTreeJwtToken {
  return jwtDecode<SceneTreeJwtToken>(jwt);
}
