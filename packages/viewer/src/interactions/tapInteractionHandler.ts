import { Point } from '@vertexvis/geometry';
import { InteractionApi } from './interactionApi';
import { InteractionHandler } from './interactionHandler';
import { TapEventKeys } from './tapEventDetails';
import { ConfigProvider } from '../config/config';
import { BaseEvent } from './interactionEvent';

type TapEmitter = (
  position: Point.Point,
  keyDetails?: Partial<TapEventKeys>,
  downPosition?: Point.Point
) => Promise<void> | void;

export class TapInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private interactionApi?: InteractionApi;

  private pointerDownPosition?: Point.Point;

  // Double tap positions
  private firstPointerDownPosition?: Point.Point;
  private secondPointerDownPosition?: Point.Point;

  private doubleTapTimer?: any;
  private longPressTimer?: any;

  public constructor(
    protected downEvent: 'mousedown' | 'pointerdown',
    protected upEvent: 'mouseup' | 'pointerup',
    protected moveEvent: 'mousemove' | 'pointermove',
    private getConfig: ConfigProvider,
  ) {
    this.handleDown = this.handleDown.bind(this);
    this.handleUp = this.handleUp.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerEnd = this.handlePointerEnd.bind(this);
    this.clearPositions = this.clearPositions.bind(this);
    this.restartDoubleTapTimer = this.restartDoubleTapTimer.bind(this);
    this.clearDoubleTapTimer = this.clearDoubleTapTimer.bind(this);
    this.restartLongPressTimer = this.restartLongPressTimer.bind(this);
    this.clearLongPressTimer = this.clearLongPressTimer.bind(this);
    this.setPointerPositions = this.setPointerPositions.bind(this);
    this.emit = this.emit.bind(this);
  }

  public dispose(): void {
    this.element?.removeEventListener(this.downEvent, this.handleDown);
    this.element?.removeEventListener('touchstart', this.handleTouchStart);
    this.element = undefined;

    this.clearDoubleTapTimer();
    this.clearLongPressTimer();
  }

  public initialize(element: HTMLElement, api: InteractionApi): void {
    this.element = element;
    this.interactionApi = api;
    element.addEventListener(this.downEvent, this.handleDown);
    element.addEventListener('touchstart', this.handleTouchStart);
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.setPointerPositions(
        Point.create(event.touches[0].clientX, event.touches[0].clientY)
      );

      this.restartLongPressTimer();

      window.addEventListener('touchend', this.handleTouchEnd);
      window.addEventListener('touchmove', this.handleTouchMove);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.handlePointerMove(
        Point.create(event.touches[0].clientX, event.touches[0].clientY)
      );
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.pointerDownPosition != null) {
      window.removeEventListener('touchend', this.handleTouchEnd);
      window.removeEventListener('touchmove', this.handleTouchMove);
    }

    this.handlePointerEnd(this.pointerDownPosition);
  }

  private handleDown(event: BaseEvent): void {
    this.setPointerPositions(Point.create(event.clientX, event.clientY));

    const eventKeys = {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    };
    this.restartLongPressTimer(eventKeys);

    window.addEventListener(this.upEvent, this.handleUp);
    window.addEventListener(this.moveEvent, this.handleMove);
  }

  private handleMove(event: BaseEvent): void {
    this.handlePointerMove(Point.create(event.clientX, event.clientY));
  }

  private handleUp(event: BaseEvent): void {
    if (this.pointerDownPosition != null) {
      window.removeEventListener(this.upEvent, this.handleUp);
      window.removeEventListener(this.moveEvent, this.handleMove);
    }

    this.handlePointerEnd(Point.create(event.clientX, event.clientY), {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });
  }

  private handlePointerMove(position: Point.Point): void {
    // Ignore pointer end events for this associated touch start
    // since the distance from the start is large enough
    if (
      this.pointerDownPosition != null &&
      Point.distance(position, this.pointerDownPosition) >= 2
    ) {
      this.clearPositions();
    }
  }

  private handlePointerEnd(
    position?: Point.Point,
    keyDetails: Partial<TapEventKeys> = {}
  ): void {
    if (position != null && this.pointerDownPosition != null) {
      if (
        this.doubleTapTimer != null &&
        this.secondPointerDownPosition != null
      ) {
        this.emit(this.interactionApi?.doubleTap)(
          position,
          keyDetails,
          this.secondPointerDownPosition
        );
        this.clearDoubleTapTimer();
      }

      if (this.longPressTimer != null) {
        this.emit(this.interactionApi?.tap)(position, keyDetails);
      }
    }

    this.pointerDownPosition = undefined;

    this.clearLongPressTimer();
  }

  private emit(emitter?: TapEmitter): TapEmitter {
    return (
      pointerUpPosition: Point.Point,
      keyDetails: Partial<TapEventKeys> = {},
      pointerDownPosition?: Point.Point
    ): void => {
      const downPosition = pointerDownPosition || this.pointerDownPosition;
      if (
        downPosition != null &&
        Point.distance(downPosition, pointerUpPosition) <= 1
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

  private clearPositions(): void {
    this.pointerDownPosition = undefined;
    this.firstPointerDownPosition = undefined;
    this.secondPointerDownPosition = undefined;

    this.clearDoubleTapTimer();
    this.clearLongPressTimer();
  }

  private clearDoubleTapTimer(): void {
    if (this.doubleTapTimer != null) {
      clearTimeout(this.doubleTapTimer);
    }
    this.doubleTapTimer = undefined;
    this.firstPointerDownPosition = undefined;
    this.secondPointerDownPosition = undefined;
  }

  private restartDoubleTapTimer(): void {
    this.clearDoubleTapTimer();
    this.doubleTapTimer = setTimeout(
      () => this.clearDoubleTapTimer(),
      this.getConfig().events.doubleTapThreshold
    );
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer != null) {
      clearTimeout(this.longPressTimer);
    }
    this.longPressTimer = undefined;
  }

  private restartLongPressTimer(eventKeys: Partial<TapEventKeys> = {}): void {
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      if (this.pointerDownPosition) {
        this.emit(this.interactionApi?.longPress)(
          this.pointerDownPosition,
          eventKeys
        );
      }
      this.clearLongPressTimer();
    }, this.getConfig().events.longPressThreshold);
  }

  private setPointerPositions(point: Point.Point): void {
    this.pointerDownPosition = point;
    if (this.firstPointerDownPosition == null) {
      this.restartDoubleTapTimer();
      this.firstPointerDownPosition = point;
    } else {
      this.secondPointerDownPosition = point;
    }
  }
}
