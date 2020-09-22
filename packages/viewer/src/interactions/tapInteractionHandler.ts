import { Point } from '@vertexvis/geometry';
import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';
import { TapEventKeys } from './tapEventDetails';

export class TapInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private interactionApi?: InteractionApi;

  private pointerDownPosition?: Point.Point;

  public constructor() {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  public dispose(): void {
    this.element?.removeEventListener('mousedown', this.handleMouseDown);
    this.element?.removeEventListener('touchstart', this.handleTouchStart);
    this.element = undefined;
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;

    element.addEventListener('mousedown', this.handleMouseDown);
    element.addEventListener('touchstart', this.handleTouchStart);
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.pointerDownPosition = Point.create(
        event.touches[0].clientX,
        event.touches[0].clientY
      );

      window.addEventListener('touchend', this.handleTouchEnd);
      window.addEventListener('touchmove', this.handleTouchMove);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    this.pointerDownPosition = Point.create(event.clientX, event.clientY);

    window.addEventListener('mouseup', this.handleMouseUp);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const position = Point.create(
        event.touches[0].clientX,
        event.touches[0].clientY
      );

      if (this.pointerDownPosition != null) {
        if (Point.distance(position, this.pointerDownPosition) >= 2) {
          // Ignore touch end events for this associated touch start
          // since the distance from the start is large enough
          this.pointerDownPosition = undefined;
        }
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.pointerDownPosition != null) {
      window.removeEventListener('touchend', this.handleTouchEnd);
      this.emitTap(this.pointerDownPosition);
    }

    this.pointerDownPosition = undefined;
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.pointerDownPosition != null) {
      window.removeEventListener('mouseup', this.handleMouseUp);

      this.emitTap(Point.create(event.clientX, event.clientY), {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      });
    }

    this.pointerDownPosition = undefined;
  }

  private emitTap(
    pointerUpPosition: Point.Point,
    keyDetails: Partial<TapEventKeys> = {}
  ): void {
    if (
      this.pointerDownPosition != null &&
      Point.distance(this.pointerDownPosition, pointerUpPosition) <= 1
    ) {
      const position = this.getCanvasPosition(pointerUpPosition!);
      if (position != null) {
        this.interactionApi?.tap(position, keyDetails);
      }
    }
  }

  private getCanvasPosition(point: Point.Point): Point.Point | undefined {
    const canvasBounds = this.element?.getBoundingClientRect();
    const canvasOffset =
      canvasBounds != null
        ? Point.create(canvasBounds.left, canvasBounds.top)
        : undefined;

    return canvasOffset != null
      ? Point.subtract(Point.create(point.x, point.y), canvasOffset)
      : undefined;
  }
}
