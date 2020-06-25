export class CustomError extends Error {
  public constructor(message: string, e?: Error) {
    super();

    this.message =
      e != null ? `${message} Nested exception is: ${e.message}` : message;
    this.stack = e?.stack;
    this.name = this.constructor.name;
  }
}
