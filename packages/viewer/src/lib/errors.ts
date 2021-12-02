export class CustomError extends Error {
  public constructor(message: string, e?: Error) {
    super();

    this.message = message;
    this.stack = e?.stack;
    this.name = this.constructor.name;

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class ExpiredCredentialsError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, ExpiredCredentialsError.prototype);
  }
}

export class InvalidCredentialsError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class InvalidResourceUrnError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, InvalidResourceUrnError.prototype);
  }
}

export class ViewerInitializationError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, ViewerInitializationError.prototype);
  }
}

export class ComponentInitializationError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, ComponentInitializationError.prototype);
  }
}

export class SceneRenderError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, SceneRenderError.prototype);
  }
}

export class UnsupportedOperationError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, UnsupportedOperationError.prototype);
  }
}

export class WebsocketConnectionError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, WebsocketConnectionError.prototype);
  }
}

export class InteractionHandlerError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, InteractionHandlerError.prototype);
  }
}

export class MissingJWTError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, MissingJWTError.prototype);
  }
}

export class ImageLoadError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, ImageLoadError.prototype);
  }
}

export class IllegalStateError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, IllegalStateError.prototype);
  }
}

export class NoImplementationFoundError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, NoImplementationFoundError.prototype);
  }
}

export class InvalidArgumentError extends CustomError {
  public constructor(message: string, e?: Error) {
    super(message, e);

    // Allows for `instanceof` checks.
    Object.setPrototypeOf(this, InvalidArgumentError.prototype);
  }
}
