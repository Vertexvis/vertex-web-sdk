import { BaseTapInteractionHandler } from './baseTapInteractionHandler';
import { ConfigProvider } from '../config/config';

export class PointerTapInteractionHandler extends BaseTapInteractionHandler {
  public constructor(getConfig: ConfigProvider) {
    super('pointerdown', 'pointerup', 'pointermove', getConfig);
  }

  protected registerEvents(element: HTMLElement): void {
    element.addEventListener(this.downEvent, this.handleDown);
    element.addEventListener('touchstart', this.handleTouchStart);
  }

  protected deregisterEvents(): void {
    this.element?.removeEventListener(this.downEvent, this.handleDown);
    this.element?.removeEventListener('touchstart', this.handleTouchStart);
    this.element = undefined;

    this.clearDoubleTapTimer();
    this.clearLongPressTimer();
  }
}
