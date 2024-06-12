import { Disposable, UUID } from '@vertexvis/utils';

import { BaseInteractionHandler } from './baseInteractionHandler';

export abstract class MultiElementInteractionHandler extends BaseInteractionHandler {
  protected registeredExternalElements: Record<UUID.UUID, Disposable> = {};

  public registerAdditionalElement(external: HTMLElement): Disposable {
    const id = UUID.create();
    const disposable = this.addEventListenersToElement(external);

    this.registeredExternalElements[id] = disposable;
    return disposable;
  }

  public deregisterAdditionalElementById(id: UUID.UUID): void {
    const externalElement = this.registeredExternalElements[id];

    externalElement.dispose();

    this.registeredExternalElements = Object.fromEntries(
      Object.entries(this.registeredExternalElements).filter(
        ([key]) => key !== id
      )
    );
  }

  protected deregisterAllListeners(): void {
    Object.keys(this.registeredExternalElements).forEach((id) =>
      this.deregisterAdditionalElementById(id)
    );
  }

  public abstract addEventListenersToElement(element?: HTMLElement): Disposable;
}
