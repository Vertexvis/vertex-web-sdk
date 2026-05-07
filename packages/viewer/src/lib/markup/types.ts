import { Disposable } from '@vertexvis/utils';

import { InteractionHandler } from '../interactions';

export interface BaseMarkupInteractionHandler extends InteractionHandler {
  initialize(element: HTMLElement): void;
}

export interface MarkupEnabledElement {
  registerInteractionHandler(
    handler: BaseMarkupInteractionHandler
  ): Promise<Disposable> | Disposable;
}
