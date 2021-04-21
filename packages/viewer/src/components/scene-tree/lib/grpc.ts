import { ServiceError } from '@vertexvis/scene-tree-protos/scenetree/protos/scene_tree_api_pb_service';

export function isGrpcServiceError(err: any): err is ServiceError {
  return typeof err.code === 'number' && err.hasOwnProperty('metadata');
}
