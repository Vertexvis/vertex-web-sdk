import { Point } from '@vertexvis/geometry';

import { ConfigProvider } from '../config';
import { InteractionApi } from './interactionApi';
import { BaseEvent } from './interactionEvent';
import { InteractionHandler } from './interactionHandler';
import { TapEventKeys } from './tapEventDetails';

type TapEmitter = (
  position: Point.Point,
  keyDetails?: Partial<TapEventKeys>,
  buttons?: number,
  downPosition?: Point.Point
) => Promise<void> | void;

export class TapInteractionHandler implements InteractionHandler {
  private element?: HTMLElement;
  private interactionApi?: InteractionApi;

  private pointerDownPosition?: Point.Point;

  // Double tap positions
  private firstPointerDownPosition?: Point.Point;
  private secondPointerDownPosition?: Point.Point;

  private doubleTapTimer?: number;
  private longPressTimer?: number;
  private interactionTimer?: number;

  private buttons?: number;

  public constructor(
    protected downEvent: 'mousedown' | 'pointerdown',
    protected upEvent: 'mouseup' | 'pointerup',
    protected moveEvent: 'mousemove' | 'pointermove',
    private getConfig: ConfigProvider
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
        Point.create(event.touches[0].clientX, event.touches[0].clientY),
        true
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
    this.buttons = event.buttons;

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
    this.handlePointerMove(
      Point.create(event.clientX, event.clientY),
      this.isTouch(event)
    );
  }

  private handleUp(event: BaseEvent): void {
    if (this.pointerDownPosition != null) {
      window.removeEventListener(this.upEvent, this.handleUp);
      window.removeEventListener(this.moveEvent, this.handleMove);
    }

    this.handlePointerEnd(
      Point.create(event.clientX, event.clientY),
      {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      },
      this.buttons,
      this.isTouch(event)
    );
    this.buttons = undefined;
  }

  private handlePointerMove(position: Point.Point, isTouch?: boolean): void {
    // Ignore pointer end events for this associated touch start
    // since the distance from the start is large enough
    const threshold = this.interactionApi?.pixelThreshold(isTouch) || 2;
    if (
      this.pointerDownPosition != null &&
      Point.distance(position, this.pointerDownPosition) >= threshold &&
      this.interactionTimer == null
    ) {
      this.clearPositions();
    }
  }

  private handlePointerEnd(
    position?: Point.Point,
    keyDetails: Partial<TapEventKeys> = {},
    buttons = 0,
    isTouch = false
  ): void {
    if (position != null) {
      if (this.longPressTimer != null) {
        this.emit(this.interactionApi?.tap)(position, keyDetails, buttons);
      }

      if (
        this.doubleTapTimer != null &&
        this.secondPointerDownPosition != null
      ) {
        this.emit(this.interactionApi?.doubleTap)(
          position,
          keyDetails,
          buttons,
          this.secondPointerDownPosition
        );
        this.clearDoubleTapTimer();
      }
    }

    this.pointerDownPosition = undefined;

    this.clearLongPressTimer();
  }

  private emit(emitter?: TapEmitter): TapEmitter {
    return (
      pointerUpPosition: Point.Point,
      keyDetails: Partial<TapEventKeys> = {},
      buttons = 0,
      pointerDownPosition?: Point.Point,
      isTouch = false
    ): void => {
      const downPosition = pointerDownPosition || this.pointerDownPosition;
      const threshold = this.interactionApi?.pixelThreshold(isTouch) || 1;

      let emittedPosition: Point.Point | undefined;
      if (this.interactionTimer != null) {
        emittedPosition = this.getCanvasPosition(
          downPosition || pointerUpPosition
        );
      } else if (
        downPosition != null &&
        Point.distance(downPosition, pointerUpPosition) <= threshold
      ) {
        emittedPosition = this.getCanvasPosition(pointerUpPosition);
      }
      if (emittedPosition != null && emitter != null) {
        emitter(emittedPosition, keyDetails, buttons);
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
    this.clearInteractionTimer();
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
      this.getConfig().events.doubleTapThreshold
    );
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer != null) {
      window.clearTimeout(this.longPressTimer);
    }
    this.longPressTimer = undefined;
  }

  private restartLongPressTimer(eventKeys: Partial<TapEventKeys> = {}): void {
    this.clearLongPressTimer();
    this.longPressTimer = window.setTimeout(() => {
      if (this.pointerDownPosition) {
        this.emit(this.interactionApi?.longPress)(
          this.pointerDownPosition,
          eventKeys,
          this.buttons
        );
      }
      this.clearLongPressTimer();
    }, this.getConfig().events.longPressThreshold);
  }

  private restartInteractionTimer(): void {
    this.clearInteractionTimer();
    this.interactionTimer = window.setTimeout(() => {
      this.interactionTimer = undefined;
    }, this.getConfig().interactions.interactionDelay);
  }

  private clearInteractionTimer(): void {
    if (this.interactionTimer != null) {
      window.clearTimeout(this.interactionTimer);
      this.interactionTimer = undefined;
    }
  }

  private setPointerPositions(point: Point.Point): void {
    this.pointerDownPosition = point;
    this.restartInteractionTimer();
    if (this.firstPointerDownPosition == null) {
      this.restartDoubleTapTimer();
      this.firstPointerDownPosition = point;
    } else {
      this.secondPointerDownPosition = point;
    }
  }

  private isTouch(event: BaseEvent): boolean {
    return window.PointerEvent != null && event instanceof PointerEvent
      ? event.pointerType === 'touch'
      : false;
  }
}
