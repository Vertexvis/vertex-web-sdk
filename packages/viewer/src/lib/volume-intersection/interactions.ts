import { Disposable } from '@vertexvis/utils';

import { boxQueryCursor } from '../cursors';
import { getMouseClientPosition } from '../dom';
import { InteractionApi } from '../interactions';
import { InteractionHandler } from '../interactions/interactionHandler';
import { VolumeIntersectionQueryController } from './controller';

export class VolumeIntersectionQueryInteractionHandler
  implements InteractionHandler
{
  private element?: HTMLElement;
  private api?: InteractionApi;
  private isInteracting?: boolean;
  private enabled?: boolean;
  private elementBounds?: DOMRect;
  private crosshairCursorDisposable?: Disposable;
  private waitCursorDisposable?: Disposable;

  public constructor(private controller: VolumeIntersectionQueryController) {
    this.handleDragBegin = this.handleDragBegin.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);

    this.enabled = true;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.api = api;

    this.element.addEventListener('pointerdown', this.handleDragBegin);
    this.addCrosshairCursor();
  }

  public dispose(): void {
    this.element?.removeEventListener('pointerdown', this.handleDragBegin);
    window.removeEventListener('pointermove', this.handleDrag);
    window.removeEventListener('pointerup', this.handleDragEnd);
    this.crosshairCursorDisposable?.dispose();
    this.waitCursorDisposable?.dispose();

    this.element = undefined;
    this.api = undefined;
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public enable(): void {
    this.enabled = true;
  }

  private handleDragBegin(event: PointerEvent): void {
    if (
      this.enabled &&
      this.isPrimaryMouseButtonClick(event) &&
      !this.isInteracting
    ) {
      this.elementBounds = this.element?.getBoundingClientRect();
      this.isInteracting = true;
      this.controller.setStartPoint(
        getMouseClientPosition(event, this.elementBounds)
      );

      window.addEventListener('pointermove', this.handleDrag);
      window.addEventListener('pointerup', this.handleDragEnd);
    }
  }

  private handleDrag(event: PointerEvent): void {
    if (this.enabled) {
      this.controller.setEndPoint(
        getMouseClientPosition(event, this.elementBounds)
      );
    }
  }

  private async handleDragEnd(): Promise<void> {
    this.isInteracting = false;

    window.removeEventListener('pointermove', this.handleDrag);
    window.removeEventListener('pointerup', this.handleDragEnd);

    this.crosshairCursorDisposable?.dispose();
    if (this.enabled) {
      this.addWaitCursor();
      try {
        await this.controller.execute();
      } finally {
        this.waitCursorDisposable?.dispose();
        this.addCrosshairCursor();
      }
    }
  }

  private isPrimaryMouseButtonClick(event: PointerEvent): boolean {
    return event.buttons === 1;
  }

  private addCrosshairCursor(): void {
    this.crosshairCursorDisposable?.dispose();
    this.crosshairCursorDisposable = this.api?.addCursor(boxQueryCursor);
  }

  private addWaitCursor(): void {
    this.waitCursorDisposable?.dispose();
    this.waitCursorDisposable = this.api?.addCursor('wait');
  }
}
