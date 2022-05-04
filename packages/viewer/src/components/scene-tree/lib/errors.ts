export enum SceneTreeErrorCode {
  UNKNOWN = 0,
  SCENE_TREE_DISABLED = 1,
  UNINITIALIZED_VIEWER = 2,
  DISCONNECTED = 3,
}

export class SceneTreeErrorDetails {
  public readonly message: string;

  public constructor(
    public readonly code: SceneTreeErrorCode,
    public readonly link?: string
  ) {
    this.message = getSceneTreeErrorMessage(code);
  }
}

function getSceneTreeErrorMessage(code: SceneTreeErrorCode): string {
  switch (code) {
    case SceneTreeErrorCode.UNKNOWN:
      return 'An unknown error occurred.';
    case SceneTreeErrorCode.SCENE_TREE_DISABLED:
      return 'The tree for this scene is not enabled. Enable the tree for this scene to interact with the tree.';
    case SceneTreeErrorCode.UNINITIALIZED_VIEWER:
      return 'Could not find reference to the viewer';
    case SceneTreeErrorCode.DISCONNECTED:
      return 'Disconnected from server.';
  }
}
