export class CustomError extends Error {
  public constructor(message: string, e?: Error) {
    super();

    this.message =
      e != null ? `${message} Nested exception is: ${e.message}` : message;
    this.stack = e?.stack;
    this.name = this.constructor.name;
  }
}

export class ExpiredCredentialsError extends CustomError {}

export class InvalidCredentialsError extends CustomError {}

export class InvalidResourceUrnError extends CustomError {}

export class ViewerInitializationError extends CustomError {}

export class ComponentInitializationError extends CustomError {}

export class SceneRenderError extends CustomError {}

export class UnsupportedOperationError extends CustomError {}

export class WebsocketConnectionError extends CustomError {}

export class InteractionHandlerError extends CustomError {}

export class MissingJWTError extends CustomError {}

export class ImageLoadError extends CustomError {}

export class IllegalStateError extends CustomError {}

export class NoImplementationFoundError extends CustomError {}

export class InvalidArgumentError extends CustomError {}
