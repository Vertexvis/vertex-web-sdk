import { Point } from '@vertexvis/geometry';

import { InteractionHandler } from '../interactions/interactionHandler';
import { VolumeIntersectionQueryController } from './controller';

export class VolumeIntersectionQueryInteractionHandler
  implements InteractionHandler
{
  private element?: HTMLElement;

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
    this.element?.removeEventListener('pointermove', this.handleDrag);
    this.element?.removeEventListener('pointerup', this.handleDragEnd);
  }

  private handleDragBegin(event: PointerEvent): void {
    if (event.buttons === 1) {
      this.controller.setStartPoint(Point.create(event.offsetX, event.offsetY));

      this.element?.addEventListener('pointermove', this.handleDrag);
      this.element?.addEventListener('pointerup', this.handleDragEnd);
    }
  }

  private handleDrag(event: PointerEvent): void {
    this.controller.setEndPoint(Point.create(event.offsetX, event.offsetY));
  }

  private handleDragEnd(): void {
    this.controller.execute();

    this.element?.removeEventListener('pointermove', this.handleDrag);
    this.element?.removeEventListener('pointerup', this.handleDragEnd);
  }
}
