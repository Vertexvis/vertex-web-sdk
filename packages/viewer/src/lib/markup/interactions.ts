import type { InteractionApi, InteractionHandler } from '../interactions';

export abstract class MarkupInteractionHandler implements InteractionHandler {
  protected element?: HTMLElement;
  protected elementBounds?: DOMRect;
  protected api?: InteractionApi;

  private resizeObserver: ResizeObserver;

  public constructor() {
    this.resizeObserver = new ResizeObserver(([entry]) => {
      this.elementBounds = this.computeBoundingRect();
    });
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.elementBounds = this.computeBoundingRect();
    this.resizeObserver.observe(this.element);

    this.element.addEventListener('pointerdown', this.handlePointerDown);
  }

  public dispose(): void {
    this.resizeObserver.disconnect();
    this.element?.removeEventListener('pointerdown', this.handlePointerDown);

    this.element = undefined;
    this.api = undefined;
  }

  protected acceptInteraction(): void {
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    this.handleInteractionAttempt(event);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    this.handleInteractionMove(event);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);

    this.handleInteractionEnd(event);
  };

  protected abstract computeBoundingRect(): DOMRect;

  protected abstract handleInteractionAttempt(event: PointerEvent): void;

  protected abstract handleInteractionMove(event: PointerEvent): void;

  protected abstract handleInteractionEnd(event: PointerEvent): void;
}
