import { Point } from '@vertexvis/geometry';

import { InteractionApi } from './interactionApi';
import { MultiTouchInteractionHandler } from './multiTouchInteractionHandler';

export class TouchInteractionHandler extends MultiTouchInteractionHandler {
  private currentPosition1?: Point.Point;
  private isInteracting?: boolean;

  public constructor() {
    super();
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  public dispose(): void {
    this.element?.removeEventListener('touchstart', this.handleTouchStart);
    super.dispose();
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    super.initialize(element, api);

    element.addEventListener('touchstart', this.handleTouchStart);
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length >= 1) {
      event.preventDefault();

      const touch1 = event.touches[0];

      this.currentPosition1 = Point.create(touch1.screenX, touch1.screenY);

      if (event.touches[1] != null) {
        this.beginTwoPointTouch(
          this.currentPosition1,
          Point.create(event.touches[1].screenX, event.touches[1].screenY)
        );
      }

      window.addEventListener('touchmove', this.handleTouchMove, {
        passive: false,
      });
      window.addEventListener('touchend', this.handleTouchEnd);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1) {
      this.handleOnePointTouchMove(event.touches[0]);
    } else if (event.touches.length === 2) {
      const point1 = Point.create(
        event.touches[0].clientX,
        event.touches[0].clientY
      );
      const point2 = Point.create(
        event.touches[1].clientX,
        event.touches[1].clientY
      );

      this.handleTwoPointTouchMove(point1, point2);
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    this.interactionApi?.endInteraction();

    this.isInteracting = false;

    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);

    this.endTwoPointTouch();
  }

  private handleOnePointTouchMove(touch: Touch): void {
    const position = Point.create(touch.screenX, touch.screenY);

    if (this.currentPosition1 != null) {
      const delta = Point.subtract(position, this.currentPosition1);
      const threshold = this.interactionApi?.pixelThreshold(true) || 2;
      if (
        Point.distance(position, this.currentPosition1) >= threshold ||
        this.isInteracting
      ) {
        this.interactionApi?.beginInteraction();
        this.interactionApi?.rotateCamera(delta);
        this.isInteracting = true;
      }
    }

    this.currentPosition1 = position;
  }
}
