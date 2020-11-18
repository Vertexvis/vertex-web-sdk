import { Point } from '@vertexvis/geometry';
import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';
import { TapEventKeys } from './tapEventDetails';

type TapEmitter = (
  position: Point.Point,
  keyDetails?: Partial<TapEventKeys>
) => Promise<void> | void;

export class TapInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private interactionApi?: InteractionApi;

  private firstPointerDownPosition?: Point.Point;
  private secondPointerDownPosition?: Point.Point;
  private doubleTapTimer?: number;

  public constructor() {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.emitTap = this.emitTap.bind(this);
    this.restartDoubleTapTimer = this.restartDoubleTapTimer.bind(this);
    this.clearDoubleTapTimer = this.clearDoubleTapTimer.bind(this);
    this.setPointerPositions = this.setPointerPositions.bind(this);
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
      this.setPointerPositions(
        Point.create(event.touches[0].clientX, event.touches[0].clientY)
      );

      window.addEventListener('touchend', this.handleTouchEnd);
      window.addEventListener('touchmove', this.handleTouchMove);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    this.setPointerPositions(Point.create(event.clientX, event.clientY));

    window.addEventListener('mouseup', this.handleMouseUp);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const position = Point.create(
        event.touches[0].clientX,
        event.touches[0].clientY
      );

      if (this.firstPointerDownPosition != null) {
        if (Point.distance(position, this.firstPointerDownPosition) >= 2) {
          // Ignore touch end events for this associated touch start
          // since the distance from the start is large enough
          this.firstPointerDownPosition = undefined;
        }
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.firstPointerDownPosition != null) {
      window.removeEventListener('touchend', this.handleTouchEnd);

      if (
        this.doubleTapTimer != null &&
        this.secondPointerDownPosition != null
      ) {
        this.emitTap(this.interactionApi?.doubleTap)(
          this.firstPointerDownPosition
        );
        this.clearDoubleTapTimer();
      } else {
        this.emitTap(this.interactionApi?.tap)(this.firstPointerDownPosition);
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.firstPointerDownPosition != null) {
      window.removeEventListener('mouseup', this.handleMouseUp);

      const tapPoint = Point.create(event.clientX, event.clientY);
      const eventKeys = {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      };

      if (
        this.doubleTapTimer != null &&
        this.secondPointerDownPosition != null
      ) {
        this.emitTap(this.interactionApi?.doubleTap)(tapPoint, eventKeys);
        this.clearDoubleTapTimer();
      } else {
        this.emitTap(this.interactionApi?.tap)(tapPoint, eventKeys);
      }
    }
  }

  private emitTap(emitter?: TapEmitter): TapEmitter {
    return (
      pointerUpPosition: Point.Point,
      keyDetails: Partial<TapEventKeys> = {}
    ): void => {
      if (
        this.firstPointerDownPosition != null &&
        Point.distance(this.firstPointerDownPosition, pointerUpPosition) <= 1
      ) {
        const position = this.getCanvasPosition(pointerUpPosition);
        if (position != null && emitter != null) {
          emitter(position, keyDetails);
        }
      }
    };
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

  private clearDoubleTapTimer(): void {
    if (this.doubleTapTimer != null) {
      window.clearTimeout(this.doubleTapTimer);
    }
    this.doubleTapTimer = undefined;
    this.firstPointerDownPosition = undefined;
    this.secondPointerDownPosition = undefined;
  }

  private restartDoubleTapTimer(): void {
    this.clearDoubleTapTimer();
    this.doubleTapTimer = window.setTimeout(
      () => this.clearDoubleTapTimer(),
      1000
    );
  }

  private setPointerPositions(point: Point.Point): void {
    if (this.firstPointerDownPosition == null) {
      this.restartDoubleTapTimer();
      this.firstPointerDownPosition = point;
    } else {
      this.secondPointerDownPosition = point;
    }
  }
}
