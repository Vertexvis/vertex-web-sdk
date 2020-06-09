import { Dimensions } from '@vertexvis/geometry';

export interface Operation {
  type: string;
  operationId: string;
}

export interface LoadSceneStateOperation extends Operation {
  type: 'LoadSceneStateOperation';
  sceneStateId: string;
  dimensions: Dimensions.Dimensions;
}
