import { UUID } from '@vertexvis/utils';

export interface SceneViewStateId {
  id: UUID.UUID;
}

export interface SceneViewStateSuppliedId {
  suppliedId: string;
}

/**
 * An object describing an ID for the scene view state. Can either be an
 * object containing the ID generated on creation, or an object containing
 * a supplied id provided during creation.
 */
export type SceneViewStateIdentifier =
  | SceneViewStateId
  | SceneViewStateSuppliedId;

export function isSceneViewStateId(
  identifier: SceneViewStateIdentifier
): identifier is SceneViewStateId {
  return (identifier as SceneViewStateId).id != null;
}

export function isSceneViewStateSuppliedId(
  identifier: SceneViewStateIdentifier
): identifier is SceneViewStateSuppliedId {
  return (identifier as SceneViewStateSuppliedId).suppliedId != null;
}
