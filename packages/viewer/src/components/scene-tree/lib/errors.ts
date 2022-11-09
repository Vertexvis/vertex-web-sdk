import { CustomError } from '../../../lib/errors';

export enum SceneTreeErrorCode {
  UNKNOWN = 0,
  SCENE_TREE_DISABLED = 1,
  MISSING_VIEWER = 2,
  DISCONNECTED = 3,
  SUBSCRIPTION_FAILURE = 4,
  UNAUTHORIZED = 5,
}

export class SceneTreeErrorDetails {
  public readonly message: string;

  public constructor(
    public readonly name: keyof typeof SceneTreeErrorCode,
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
    case SceneTreeErrorCode.MISSING_VIEWER:
      return 'Could not find reference to the viewer';
    case SceneTreeErrorCode.DISCONNECTED:
      return 'Disconnected from server.';
    case SceneTreeErrorCode.SUBSCRIPTION_FAILURE:
      return 'The tree was not able to receive subscription events';
    case SceneTreeErrorCode.UNAUTHORIZED:
      return 'The tree was unauthorized to connect to the server. The associated Viewer may not be connected.';
  }
}

export class SceneTreeError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, SceneTreeError.prototype);
  }
}

export class SceneTreeUnauthorizedError extends SceneTreeError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, SceneTreeUnauthorizedError.prototype);
  }
}

export class SceneTreeConnectionCancelledError extends SceneTreeError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, SceneTreeConnectionCancelledError.prototype);
  }
}

export class SceneTreeOperationFailedError extends SceneTreeError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, SceneTreeOperationFailedError.prototype);
  }
}
