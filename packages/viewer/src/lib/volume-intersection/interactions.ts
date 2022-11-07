import { Point } from '@vertexvis/geometry';

import { InteractionHandler } from '../interactions/interactionHandler';
import { VolumeIntersectionQueryController } from './controller';

export class VolumeIntersectionQueryInteractionHandler
  implements InteractionHandler
{
  private element?: HTMLElement;
  private isInteracting?: boolean;

  public constructor(private controller: VolumeIntersectionQueryController) {
    this.handleDragBegin = this.handleDragBegin.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
  }

  public initialize(element: HTMLElement): void {
    this.element = element;

    this.element.addEventListener('pointerdown', this.handleDragBegin);
  }

  public dispose(): void {
    this.element?.removeEventListener('pointerdown', this.handleDragBegin);
    window.removeEventListener('pointermove', this.handleDrag);
    window.removeEventListener('pointerup', this.handleDragEnd);
  }

  private handleDragBegin(event: PointerEvent): void {
    if (event.buttons === 1 && !this.isInteracting) {
      this.isInteracting = true;
      this.controller.setStartPoint(Point.create(event.offsetX, event.offsetY));

      window.addEventListener('pointermove', this.handleDrag);
      window.addEventListener('pointerup', this.handleDragEnd);
    }
  }

  private handleDrag(event: PointerEvent): void {
    this.controller.setEndPoint(Point.create(event.offsetX, event.offsetY));
  }

  private handleDragEnd(): void {
    this.controller.execute();
    this.isInteracting = false;

    window.removeEventListener('pointermove', this.handleDrag);
    window.removeEventListener('pointerup', this.handleDragEnd);
  }
}
