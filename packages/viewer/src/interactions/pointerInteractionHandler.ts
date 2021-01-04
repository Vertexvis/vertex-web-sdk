import { BaseInteractionHandler } from './baseInteractionHandler';

export class PointerInteractionHandler extends BaseInteractionHandler {
  public constructor() {
    super('pointerdown', 'pointerup', 'pointermove');
  }

  protected registerEvents(element: HTMLElement): void {
    element.addEventListener('pointerdown', this.handleDownEvent);
    element.addEventListener('wheel', this.handleMouseWheel);
  }

  protected deregisterEvents(): void {
    this.element?.removeEventListener('pointerdown', this.handleDownEvent);
    this.element?.removeEventListener('wheel', this.handleMouseWheel);
    this.element = undefined;
  }
}
