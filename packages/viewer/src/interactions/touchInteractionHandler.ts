import { Point } from '@vertexvis/geometry';
import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';

export class TouchInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private interactionApi?: InteractionApi;

  private currentPosition1?: Point.Point;
  private currentPosition2?: Point.Point;

  public constructor() {
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  public dispose(): void {
    this.element?.removeEventListener('touchstart', this.handleTouchStart);
    this.element = undefined;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;

    element.addEventListener('touchstart', this.handleTouchStart);
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length >= 1) {
      event.preventDefault();

      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      this.currentPosition1 = Point.create(touch1.screenX, touch1.screenY);
      this.currentPosition2 =
        touch2 != null
          ? Point.create(touch2.screenX, touch2.screenY)
          : undefined;

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
      this.handleTwoPointTouchMove(event.touches[0], event.touches[1]);
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.interactionApi?.endInteraction();

    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }

  private handleOnePointTouchMove(touch: Touch): void {
    const position = Point.create(touch.screenX, touch.screenY);

    if (this.currentPosition1 != null) {
      const delta = Point.subtract(position, this.currentPosition1);

      if (Point.distance(position, this.currentPosition1) >= 2) {
        this.interactionApi?.beginInteraction();
        this.interactionApi?.rotateCamera(delta);
      }
    }

    this.currentPosition1 = position;
  }

  private handleTwoPointTouchMove(touch1: Touch, touch2: Touch): void {
    const position1 = Point.create(touch1.screenX, touch1.screenY);
    const position2 = Point.create(touch2.screenX, touch2.screenY);

    if (this.currentPosition1 != null && this.currentPosition2 != null) {
      const delta = Point.scale(
        Point.add(
          Point.subtract(position1, this.currentPosition1),
          Point.subtract(position2, this.currentPosition2)
        ),
        0.25,
        0.25
      );
      const distance =
        Point.distance(position1, position2) -
        Point.distance(this.currentPosition1, this.currentPosition2);
      const zoom = distance * 0.5;

      this.interactionApi?.beginInteraction();
      this.interactionApi?.zoomCamera(zoom);
      this.interactionApi?.panCamera(delta);
    }

    this.currentPosition1 = position1;
    this.currentPosition2 = position2;
  }
}
