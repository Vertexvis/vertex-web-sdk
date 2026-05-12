import { Disposable } from '../disposable';
import { BasicInteractionHandler } from '../interactions/basicInteractionHandler';

export interface BasicViewer {
  registerBasicInteractionHandler(
    interactionHandler: BasicInteractionHandler
  ): Promise<Disposable>;
}
