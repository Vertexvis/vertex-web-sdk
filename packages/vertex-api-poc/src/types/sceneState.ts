import { Camera } from '@vertexvis/graphics3d';
import { UUID } from '@vertexvis/utils';

export interface SceneState {
  id: UUID.UUID;
  sceneGraphId?: UUID.UUID;
  camera?: SceneStateCamera;
}

export type SceneStateCamera = Pick<
  Camera.Camera,
  'upvector' | 'lookat' | 'position'
>;
