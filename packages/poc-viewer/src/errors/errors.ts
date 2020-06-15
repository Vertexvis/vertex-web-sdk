import { CustomError } from './customError';

export class ExpiredCredentialsError extends CustomError {}

export class InvalidCredentialsError extends CustomError {}

export class ViewerInitializationError extends CustomError {}

export class ComponentInitializationError extends CustomError {}

export class SceneRenderError extends CustomError {}

export class UnsupportedOperationError extends CustomError {}

export class WebsocketConnectionError extends CustomError {}

export class InteractionHandlerError extends CustomError {}

export class ImageLoadError extends CustomError {}

export class IllegalStateError extends CustomError {}
