import { BaseInteractionHandler } from './baseInteractionHandler';
import {
  ZoomInteraction,
  PanInteraction,
  RotateInteraction,
} from './mouseInteractions';

export class PointerInteractionHandler extends BaseInteractionHandler {
  public constructor() {
    super(
      'pointerdown',
      'pointerup',
      'pointermove',
      new RotateInteraction(),
      new ZoomInteraction(),
      new PanInteraction()
    );
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
