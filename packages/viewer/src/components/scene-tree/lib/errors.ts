export enum SceneTreeErrorCode {
  UNKNOWN = 0,
  SCENE_TREE_DISABLED = 1,
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
      return 'The tree for this scene cannot be loaded, because this feature is disabled.';
  }
}
