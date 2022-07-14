import { Node } from '@vertexvis/scene-tree-protos/scenetree/protos/domain_pb';

export type SceneTreeOperationHandler = (
  event: PointerEvent,
  node: Node.AsObject,
  tree: HTMLVertexSceneTreeElement
) => void;
